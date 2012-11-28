from simple_rest import Resource
from dontmiss.api.models import Ticket
from dontmiss.api.http import JsonResponse

class HeliumResource(Resource):
    def post(request):
        with open('/tmp/helium', 'a') as f:
            f.write(request.body + '\n')

        return JsonResponse({'status': 'ok'})
