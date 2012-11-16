import datetime
from simple_rest import Resource
from dontmiss.api.http import JsonResponse
from dontmiss.api.models import Workout

class WorkoutsResource(Resource):
    def get(self, request):
        return JsonResponse([w.dict() for w in Workout.objects.all()], status=200)

    def put(self, request):
        status = 200
        response = {}
        try:
            w = Workout(
                type = request.REQUEST['type'],
                note = request.REQUEST['note'],
                amount = float(request.REQUEST['amount']),
                dt = datetime.datetime.fromtimestamp(float(request.REQUEST['dt']))
            )
            w.save()
        except Exception as e:
            print e
            response = {'error': 'invalid workout'}
            status = 400

        return JsonResponse(response, status=status)
