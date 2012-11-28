from simple_rest import Resource
from dontmiss.api.models import Ticket, Member, Workout
from dontmiss.api.http import JsonResponse

class TicketsResource(Resource):
    def get(self, request):
        tickets = list(Ticket.objects.all())
        tickets.sort(key=lambda t: t.workout.dt, reverse=True)
        json = [t.dict() for t in tickets]
        return JsonResponse(json, status=200)

    def put(self, request):
        status = 200
        response = {}
        try:
            user = Member.objects.get(name=request.REQUEST['name'])
            workout = Workout.objects.get(pk=request.REQUEST['workout_id'])
            if not Ticket.objects.filter(user=user, workout=workout).exists():
                t = Ticket(user=user, workout=workout)
                t.save()
        except Exception as e:
            response = {'error': str(e)}
            status = 400

        return JsonResponse(response, status=status)
