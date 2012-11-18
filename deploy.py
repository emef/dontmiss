import os
from fabric.api import *

env.roledefs = {
    'web': [
        'ttforbes.com'
    ],
}


env.user = "matt"
env.project_dir = '/home/matt/src/dontmiss/'
env.env_prefix = 'source ably/bin/activate'

@roles('web')
def update_env():
    with cd(env.project_dir):
        with prefix(env.env_prefix):
            run('pip install -r requirements.txt')

def git_push():
    try:
        local('git add .')
        local('git commit -am "[AUTO COMMIT]"')
        local('git push origin master')
    except:
        pass


@roles('web')
def git_pull():
    with cd(env.project_dir):
        run('git stash')
        run('git pull origin master')
        with prefix(env.env_prefix):
            run('python manage.py collectstatic --noinput')

@roles('web')
def restart_webserver():
    with cd(env.project_dir):
        with prefix(env.env_prefix):
            run('uwsgi --ini dontmiss/uwsgi.ini')
            sudo('/etc/init.d/nginx restart')

def deploy():
    execute(git_push)
    execute(git_pull)
    execute(update_env)
    execute(restart_webserver)
