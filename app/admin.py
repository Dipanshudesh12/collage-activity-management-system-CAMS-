from django.contrib import admin
from .models import User, Activity, Enrollment


class UserAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'role', 'is_approved')
    list_filter = ('role', 'is_approved')
    search_fields = ('name', 'email')


admin.site.register(User, UserAdmin)
admin.site.register(Activity)
admin.site.register(Enrollment)