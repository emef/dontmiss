import os
from fabric.api import *

env.roledefs = {
    'web': [
        'ttforbes.com'
    ],
}


env.user = "matt"
env.project_dir = '/usr/django/dontmiss/'

@roles('web')
def update_env():
    with cd(env.project_dir):
        run('git stash')
        run('pip install requirements.txt')

@roles('web')
def git_pull():
    with cd(env.project_dir):
        run('git stash')
        run('git pull origin master')

@roles('web')
def restart_webserver():
    with prefix('source %s/orchard/bin/activate' % freshenv_path):
        sudo('service uwsgi restart')
        sudo('/etc/init.d/nginx restart')

def deploy():
    execute(git_pull)
    execute(update_env)
    execute(restart_webserver)
