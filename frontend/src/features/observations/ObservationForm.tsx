import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { observationsApi, type ObservationPayload } from '../../api/observations.api';
import { useAuthStore } from '../../store/auth.store';
import {
  Save, Send, AlertCircle, Droplets, Settings, MapPin,
  Loader2, CheckCircle2, XCircle, Clock
} from 'lucide-react';

// ── Validation schemas (two modes) ──────────────────────────────────────────

const draftSchema = z.object({
  site: z.number().positive('Site is required'),
  water_level_m: z.number().min(0).nullable().optional(),
  observation_date: z.string().min(1, 'Date is required'),
  observation_time: z.string().optional(),
  weather_condition: z.string().optional(),
  remarks: z.string().optional(),
  spillway_gates_open: z.number().min(0).nullable().optional(),
  spillway_discharge_cusecs: z.number().min(0).nullable().optional(),
  sluice_gates_open: z.number().min(0).nullable().optional(),
  sluice_discharge_cusecs: z.number().min(0).nullable().optional(),
  power_units_running: z.number().min(0).nullable().optional(),
  power_generation_mw: z.number().min(0).nullable().optional(),
  rainfall_today_mm: z.number().min(0).nullable().optional(),
  inflow_cusecs: z.number().min(0).nullable().optional(),
  outflow_cusecs: z.number().min(0).nullable().optional(),
  storage_mcm: z.number().min(0).nullable().optional(),
  upstream_level_m: z.number().min(0).nullable().optional(),
  downstream_level_m: z.number().min(0).nullable().optional(),
  air_temp_celsius: z.number().nullable().optional(),
  humidity_percent: z.number().min(0).max(100).nullable().optional(),
  seepage_lt_per_min: z.number().min(0).nullable().optional(),
  dam_condition: z.string().optional(),
  alert_level: z.string().optional(),
  notes: z.string().optional(),
});

const finalSchema = draftSchema.extend({
  water_level_m: z.number({ message: 'Water level (m) is required for Final Submission' }).min(0),
  observation_time: z.string().min(1, 'Observation time is required for Final Submission'),
});

type FormValues = z.infer<typeof draftSchema>;

// ── Inline feedback banner ───────────────────────────────────────────────────

type FeedbackState = { type: 'success' | 'error' | null; message: string };

// ── Auto-save draft key ──────────────────────────────────────────────────────
const getDraftKey = (userId: any) => `bbmc_draft_${userId}`;

// ── Helper: map NaN/empty/undefined fields properly to allow explicit clearing ──
function cleanPayload(values: FormValues): Partial<ObservationPayload> {
  const out: any = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) continue;
    if (v === null || v === '' || (typeof v === 'number' && isNaN(v))) {
      out[k] = null;
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ── Component ────────────────────────────────────────────────────────────────

const ObservationForm: React.FC<{
  prefillData?: Partial<FormValues>;
  existingLogId?: number;
  onSuccess?: () => void;
}> = ({ prefillData, existingLogId, onSuccess }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isFinalRef = useRef(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: '' });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  const siteId: number | undefined =
    user?.assigned_site || user?.site || prefillData?.site || undefined;

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      site: siteId,
      observation_date: new Date().toISOString().split('T')[0],
      observation_time: new Date().toTimeString().slice(0, 5),
      ...prefillData,
    }
  });

  // ── Restore draft from localStorage ────────────────────────────────────────
  useEffect(() => {
    if (existingLogId) return; // editing existing — don't overwrite
    try {
      const saved = localStorage.getItem(getDraftKey(user?.user_id));
      if (saved) {
        const parsed = JSON.parse(saved);
        reset({ ...parsed, site: siteId || parsed.site });
      }
    } catch { /* ignore */ }
  }, []);

  // ── Auto-save to localStorage every 60s ─────────────────────────────────--
  const watchedValues = watch();
  const doAutoSave = useCallback(() => {
    try {
      localStorage.setItem(getDraftKey(user?.user_id), JSON.stringify(watchedValues));
      setLastAutoSave(new Date());
    } catch { /* storage full — ignore */ }
  }, [watchedValues, user?.user_id]);

  useEffect(() => {
    const timer = setInterval(doAutoSave, 60000);
    return () => clearInterval(timer);
  }, [doAutoSave]);

  // ── GPS capture ─────────────────────────────────────────────────────────--
  const captureGps = () => {
    setGpsLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => { setGpsLoading(false); setFeedback({ type: 'error', message: 'GPS: ' + err.message }); },
      { enableHighAccuracy: true }
    );
  };

  // ── Submission mutation ─────────────────────────────────────────────────--
  const mutation = useMutation({
    mutationFn: (payload: ObservationPayload) =>
      existingLogId
        ? observationsApi.updateLog(existingLogId, payload)
        : observationsApi.createLog(payload),
    onSuccess: () => {
      const isFinal = isFinalRef.current;
      setFeedback({
        type: 'success',
        message: isFinal
          ? '✅ Observation submitted and locked for admin review.'
          : '💾 Draft saved successfully. You can continue editing.',
      });
      queryClient.invalidateQueries({ queryKey: ['recent-logs'] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      if (isFinal) {
        localStorage.removeItem(getDraftKey(user?.user_id));
        reset();
      }
      onSuccess?.();
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      let msg = 'Submission failed. Please check your connection.';
      if (typeof data === 'object') {
        const fieldErrors = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        msg = fieldErrors || msg;
      } else if (typeof data === 'string') {
        msg = data;
      }
      setFeedback({ type: 'error', message: msg });
    }
  });

  // ── Form submit handler ─────────────────────────────────────────────────--
  const onSubmit = (values: FormValues) => {
    const isFinal = isFinalRef.current;

    // Run final-mode extra validation manually
    if (isFinal) {
      const result = finalSchema.safeParse(values);
      if (!result.success) {
        const firstError = result.error.issues[0];
        setFeedback({ type: 'error', message: firstError.message });
        return;
      }
    }

    const cleaned = cleanPayload(values);
    const payload: ObservationPayload = {
      ...cleaned,
      site: siteId || values.site,
      status: isFinal ? 'FINAL' : 'DRAFT',
      entry_latitude: location?.lat ?? null,
      entry_longitude: location?.lng ?? null,
    } as ObservationPayload;

    setFeedback({ type: null, message: '' });
    mutation.mutate(payload);
  };

  // ── Render ─────────────────────────────────────────────────────────────--
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 px-4 sm:px-6 py-4 text-white flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Droplets className="text-blue-400" size={18} />
            {existingLogId ? 'Edit Draft Observation' : 'New Observation Entry'}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Site: <span className="text-white font-medium">
              {user?.station_name || user?.site_name || (siteId ? `#${siteId}` : 'Unassigned')}
            </span>
          </p>
        </div>
        {lastAutoSave && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock size={10} /> Auto-saved {lastAutoSave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Feedback banner */}
      {feedback.type && (
        <div className={`flex items-start gap-3 px-4 py-3 text-sm ${
          feedback.type === 'success' ? 'bg-green-50 text-green-800 border-b border-green-200' : 'bg-red-50 text-red-800 border-b border-red-200'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            : <XCircle size={16} className="mt-0.5 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6">

        {/* ── Section 1: Core readings ── */}
        <section>
          <SectionHeader icon={<Droplets size={16} className="text-blue-500" />} title="Water Level & Timing" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-3">
            <Field label="Water Level (m)" error={errors.water_level_m?.message} hint="Required for Final">
              <input
                type="number" step="0.001" placeholder="0.000"
                {...register('water_level_m', { valueAsNumber: true })}
                className="field-input"
              />
            </Field>
            <Field label="Observation Date" error={errors.observation_date?.message}>
              <input type="date" {...register('observation_date')} className="field-input" />
            </Field>
            <Field label="Observation Time">
              <input type="time" {...register('observation_time')} className="field-input" />
            </Field>
            <Field label="Inflow (Cusecs)">
              <input type="number" step="0.1" {...register('inflow_cusecs', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Outflow (Cusecs)">
              <input type="number" step="0.1" {...register('outflow_cusecs', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Storage (MCM)">
              <input type="number" step="0.001" {...register('storage_mcm', { valueAsNumber: true })} className="field-input" />
            </Field>
          </div>
        </section>

        {/* ── Section 2: Operational params ── */}
        <section className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100">
          <SectionHeader icon={<Settings size={16} className="text-slate-500" />} title="Operational Parameters (Optional)" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            <Field label="Spillway Gates Open">
              <input type="number" min="0" {...register('spillway_gates_open', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Spillway Discharge (cusecs)">
              <input type="number" step="0.1" {...register('spillway_discharge_cusecs', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Sluice Gates Open">
              <input type="number" min="0" {...register('sluice_gates_open', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Sluice Discharge (cusecs)">
              <input type="number" step="0.1" {...register('sluice_discharge_cusecs', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Power Units Running">
              <input type="number" min="0" {...register('power_units_running', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Power Generation (MW)">
              <input type="number" step="0.01" {...register('power_generation_mw', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Rainfall Today (mm)">
              <input type="number" step="0.1" {...register('rainfall_today_mm', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Upstream Level (m)">
              <input type="number" step="0.001" {...register('upstream_level_m', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Downstream Level (m)">
              <input type="number" step="0.001" {...register('downstream_level_m', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Air Temp (°C)">
              <input type="number" step="0.1" {...register('air_temp_celsius', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Humidity (%)">
              <input type="number" step="0.1" min="0" max="100" {...register('humidity_percent', { valueAsNumber: true })} className="field-input" />
            </Field>
            <Field label="Seepage (L/min)">
              <input type="number" step="0.01" {...register('seepage_lt_per_min', { valueAsNumber: true })} className="field-input" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <Field label="Weather Condition">
              <select {...register('weather_condition')} className="field-input">
                <option value="">-- Select --</option>
                <option>Clear</option><option>Cloudy</option><option>Rainy</option><option>Stormy</option><option>Foggy</option>
              </select>
            </Field>
            <Field label="Dam Condition">
              <select {...register('dam_condition')} className="field-input">
                <option value="">-- Select --</option>
                <option>Normal</option><option>Needs Maintenance</option><option>Critical</option>
              </select>
            </Field>
            <Field label="Alert Level">
              <select {...register('alert_level')} className="field-input">
                <option value="">-- Select --</option>
                <option value="Green">🟢 Green (Normal)</option>
                <option value="Yellow">🟡 Yellow (Warning)</option>
                <option value="Orange">🟠 Orange (High Alert)</option>
                <option value="Red">🔴 Red (Critical)</option>
              </select>
            </Field>
          </div>
        </section>

        {/* ── Section 3: Remarks + GPS ── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Field Remarks">
              <textarea rows={3} {...register('remarks')} className="field-input resize-none" placeholder="Significant observations..." />
            </Field>
            <Field label="Notes">
              <textarea rows={3} {...register('notes')} className="field-input resize-none" placeholder="Water quality, structural notes..." />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="GPS Verification (optional)">
              <button
                type="button" onClick={captureGps} disabled={gpsLoading}
                className={`field-input flex items-center justify-center gap-2 border-dashed cursor-pointer w-full sm:w-auto text-sm ${
                  location ? 'bg-green-50 border-green-300 text-green-700' : 'bg-slate-50 text-slate-600'
                }`}
              >
                {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                {location
                  ? `📍 ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                  : 'Capture GPS Location'}
              </button>
            </Field>
          </div>
        </section>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
          <button
            type="submit"
            onClick={() => { isFinalRef.current = false; }}
            disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {mutation.isPending && !isFinalRef.current
              ? <Loader2 size={16} className="animate-spin" />
              : <Save size={16} />}
            Save as Draft
          </button>
          <button
            type="submit"
            onClick={() => { isFinalRef.current = true; }}
            disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {mutation.isPending && isFinalRef.current
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />}
            Final Submission
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
          <AlertCircle size={10} />
          Final submission locks the record. Drafts auto-save locally every 60 seconds.
        </p>
      </form>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
    {icon} {title}
  </h3>
);

const Field: React.FC<{
  label: string; error?: string; hint?: string; children: React.ReactNode;
}> = ({ label, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
      {label}
      {hint && <span className="text-blue-400 normal-case font-normal">({hint})</span>}
    </label>
    {children}
    {error && <span className="text-[10px] text-red-500 font-medium">{error}</span>}
  </div>
);

export default ObservationForm;
