from simple_rest import Resource
from dontmiss.api.http import JsonResponse
from dontmiss.api.models import Member

class UsersResource(Resource):
    def get(self, request):
        return JsonResponse([u.dict() for u in Member.objects.all()], status=200)
