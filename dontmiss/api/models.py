import datetime
import simplejson
from django.db import models

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
    dt = models.DateTimeField()

    def __str__(self):
        return '<Workout|%s>' % self.type

class Ticket(models.Model, Serializable):
    user = models.ForeignKey('Member')
    workout = models.ForeignKey('Workout')
    paid = models.BooleanField(default=False)

    def __str__(self):
        return '<Ticket|%s>' % self.user.email
