# Generated by Django 5.2.1 on 2025-06-03 15:11

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rideshare_app', '0005_alter_chat_options_alter_chatmessage_options_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Package',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipient_name', models.CharField(max_length=100)),
                ('origin', models.CharField(max_length=100)),
                ('destination', models.CharField(max_length=100)),
                ('weight_kg', models.DecimalField(decimal_places=2, max_digits=5)),
                ('description', models.TextField(blank=True)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_packages', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
