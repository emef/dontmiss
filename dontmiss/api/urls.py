from django.conf.urls import patterns, include, url
from dontmiss.api.resources.tickets import TicketsResource
from dontmiss.api.resources.users import UsersResource
from dontmiss.api.resources.workouts import WorkoutsResource
from dontmiss.api.resources.helium import HeliumResource

urlpatterns = patterns('',
    url('^tickets/?', TicketsResource.as_view()),
    url('^users/?', UsersResource.as_view()),
    url('^workouts/?', WorkoutsResource.as_view()),
    url('^helium/?', HeliumResource.as_view()),
)
