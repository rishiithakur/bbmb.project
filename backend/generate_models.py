import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bbmc_backend.settings')
django.setup()

from django.db import connection

views = ['vw_site_latest_status', 'vw_gis_popup', 'vw_operator_site', 'vw_dashboard_summary', 'vw_full_entry_details']
type_map = {
    'integer':'IntegerField', 
    'character varying':'CharField', 
    'numeric':'DecimalField', 
    'timestamp with time zone':'DateTimeField', 
    'boolean':'BooleanField', 
    'date':'DateField', 
    'time without time zone':'TimeField', 
    'text':'TextField', 
    'bigint':'BigIntegerField'
}

with connection.cursor() as cursor:
    for view in views:
        class_name = ''.join(word.title() for word in view.split('_'))
        print(f'class {class_name}(models.Model):')
        cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='{view}' ORDER BY ordinal_position")
        primary_key_set = False
        for col, dtype in cursor.fetchall():
            field_type = type_map.get(dtype, 'CharField')
            pk_str = ''
            if not primary_key_set and (col == 'site_id' or col == 'log_id' or col == 'user_id'):
                pk_str = 'primary_key=True'
                primary_key_set = True
            
            if field_type == 'CharField':
                if pk_str:
                    print(f'    {col} = models.{field_type}(max_length=255, {pk_str})')
                else:
                    print(f'    {col} = models.{field_type}(max_length=255, null=True, blank=True)')
            elif field_type == 'DecimalField':
                if pk_str:
                    print(f'    {col} = models.{field_type}(max_digits=12, decimal_places=3, {pk_str})')
                else:
                    print(f'    {col} = models.{field_type}(max_digits=12, decimal_places=3, null=True, blank=True)')
            else:
                if pk_str:
                    print(f'    {col} = models.{field_type}({pk_str})')
                else:
                    print(f'    {col} = models.{field_type}(null=True, blank=True)')
        if not primary_key_set:
            print(f'    # WARNING: No primary key detected. Django requires one.')
        print(f'    class Meta:')
        print(f'        managed = False')
        print(f'        db_table = \'{view}\'')
        print('')
