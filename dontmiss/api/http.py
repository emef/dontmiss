import simplejson
from django.http import HttpResponse

class JsonResponse(HttpResponse):
    def __init__(self, obj, *args, **kwargs):
        json = simplejson.dumps(obj)
        status = kwargs.pop('status', 200)
        super(JsonResponse, self).__init__(json, *args, status=status, **kwargs)
