import simplejson
from simple_rest import Resource
from dontmiss.api.models import Ticket
from dontmiss.api.http import JsonResponse

class HeliumResource(Resource):
    def post(self, request):
        with open('/tmp/helium', 'w') as f:
            f.write(request.body)

        status = 200
        try:
            order = simplejson.loads(request.body)
            email = order['customer']['email']
            for item in order['items']:
                ticket = Ticket.objects.get(user__email=email,
                                            workout__he3_sku=item['sku'])
                ticket.paid = True
                ticket.save()

            response = {'status': 'ok'}
        except Exception as e:
            status = 400
            response = {'error': str(e)}

        return JsonResponse(response, status=status)
