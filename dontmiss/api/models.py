import datetime
import simplejson
import requests
import uuid
from django.db import models
from django.db.models import signals
from django.dispatch import receiver

HE3_KEY = '7e4f434d3377c7a3d7add62fc709c12e'

class Serializable:
    def dict(self):
        result = {}
        for key in (f.name for f in self._meta.fields):
            val = getattr(self, key)
            try:
                if isinstance(val, Serializable):
                    result[key] = val.dict()
                elif isinstance(val, datetime.datetime):
                    result[key] = val.isoformat(' ')
                elif not self.is_serializable(val):
                    result[key] = str(val)
                else:
                    result[key] = val
            except Exception as e:
                print e
        return result

    def is_serializable(self, val):
        try:
            simplejson.dumps(val)
            return True
        except:
            return False

class Member(models.Model, Serializable):
    name = models.CharField(max_length=50)
    email = models.EmailField()
    #photo = models.ImageField(upload_to='photos')

    def __str__(self):
        return '<Member|%s>' % self.email

class Workout(models.Model, Serializable):
    type = models.CharField(max_length=40)
    note = models.TextField()
    amount = models.DecimalField(max_digits=5, decimal_places=2)
    he3_sku = models.CharField(max_length=100, blank=True)
    dt = models.DateTimeField()

    def __str__(self):
        return '<Workout|%s|%s>' % (self.type, str(self.dt.date()))

class Ticket(models.Model, Serializable):
    user = models.ForeignKey('Member')
    workout = models.ForeignKey('Workout')
    paid = models.BooleanField(default=False)

    def __str__(self):
        return '<Ticket|%s>' % self.user.email



def items_url(sku):
    return 'https://gethelium.com/api/v1/items/%s' % sku

##################################################
# signals
@receiver(signals.post_save, sender=Workout)
def create_workout(sender, instance, created, **kwargs):
    if created:
        sku = str(uuid.uuid4())
        url = items_url(sku)
        auth = (HE3_KEY, '')
        data = {
            'price': int(100 * instance.amount),
            'name': 'Workout %s' % (str(instance.dt.date())),
            'type': 'general',
        }

        response = requests.put(url, auth=auth, data=data).json

        if 'errors' not in response:
            instance.he3_sku = sku
            instance.save()
        else:
            instance.delete()
            raise ValueError('; '.join(response['errors'].values()))

@receiver(signals.pre_delete, sender=Workout)
def delete_workout(sender, instance, **kwargs):
    url = items_url(instance.he3_sku)
    auth = (HE3_KEY, '')
    requests.delete(url, auth=auth)
