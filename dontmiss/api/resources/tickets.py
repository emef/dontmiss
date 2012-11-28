from simple_rest import Resource
from dontmiss.api.models import Ticket
from dontmiss.api.http import JsonResponse

class TicketsResource(Resource):
    def get(self, request):
        json = [t.dict() for t in Ticket.objects.all()]
        return JsonResponse(json, status=200)

    def put(self, request):
        status = 200
        response = {}
        try:
            t = Ticket(
                user_id = request.GET['user_id'],
                workout_id = request.GET['workout_id']
            )
            t.save()
        except:
            response = {'error': 'invalid ticket'}
            status = 400

        return JsonResponse(response, status=status)

    def delete(self, request):
        status = 200
        try:
            pk = int(request.REQUEST.get('id'))
            ticket = Ticket.objects.get(pk=pk)
            ticket.paid = True
            ticket.save()
            response = {'status': 'ok'}
        except Exception as e:
            status = 400
            response = {'status': 'error', 'message': str(e)}

        return JsonResponse(response, status=status)
