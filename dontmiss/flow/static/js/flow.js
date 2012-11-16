String.prototype.format = function() {
    var s = this.split('%s')
      , pieces = []
      , i;

    for (i=0; i<arguments.length; i++) {
        pieces.push(s[i]);
        pieces.push(arguments[i]);
    }

    for (; i<s.length; i++) {
        pieces.push(s[i]);
        if (i != s.length-1) {
            pieces.push('%s');
        }
    }
    return pieces.join('');
};

(function($) {
    function DontMiss() { this.preinit(); }

    DontMiss.prototype.preinit = function() {
        var dm = this;
        $.when(get('/api/tickets'),
               get('/api/workouts'),
               get('/api/users'))
         .done(function(r_tickets, r_workouts, r_users) {
             dm.init(r_tickets[0], r_workouts[0], r_users[0]);
         });
    };

    DontMiss.prototype.init = function(tickets, workouts, users) {
        this.tickets = tickets;
        this.workouts = workouts;
        this.users = users;
        this.setup();
    };

    DontMiss.prototype.setup = function() {
        var self = this
          , form = $('#form-login')
          , valid_emails = map(function(user) { return user.email }, this.users);
        form.on('submit', function(e) {
            email = form.find('input').val();
            if (valid_emails.indexOf(email) === -1) {
                form.addClass('error');
            } else {
                self.login(email);
            }
            return false;
        });
    };

    DontMiss.prototype.sidebar = function() {
        $('ul.nav-list').each(function() {
            var ul = $(this);
            ul.find('> li').click(function() {
                ul.find('> li').removeClass('active');
                $(this).addClass('active');
            });
        });
    };

    DontMiss.prototype.history_links = function() {
        var dm = this
          , history = $('#history');
        for (var i=0; i<this.users.length; i++) {
            var user = this.users[i]
              , link = $('<li><a href="javascript:void(0)">%s</a></li>'.format(user.name));
            history.after(link);
            link.on('click', (function(user) {
                return function() {
                    dm.show_history(user);
                }
            }(user)));
        }
    };

    DontMiss.prototype.login = function(email) {
        var dm = this;
        this.email = email;
        $('#login').fadeOut('fast', function() {
            dm.main();
        });
    };

    DontMiss.prototype.main = function() {
        this.history_links();
        this.sidebar();
        $('.username').text(this.email);
        $('#main').fadeIn('fast');
    };

    DontMiss.prototype.show_history = function(user) {
        var div = $('<div />')
          , dl = $('<dl class="dl-horizontal"/>')
          , tickets = filter(function(t) { return t.user.id === user.id }, this.tickets)
          , contribution = sum(map(function(t) { return t.workout.amount }, tickets))
          , attendance = parseInt(100 * (1 - tickets.length / this.tickets.length));

        dl.append($('<dt>Missed practices</dt>'));
        dl.append($('<dd>%s</dd>'.format(tickets.length)));
        dl.append($('<dt>Contribution</dt>'));
        dl.append($('<dd>$%s</dd>'.format(contribution)));
        dl.append($('<dt>Attendance</dt>'));
        dl.append($('<dd>%s%</dd>'.format(attendance)));

        div.append($('<h2>%s\'s Attendance History</h2>'.format(user.name)));
        div.append(dl);
        this.swap_page(div);
    };

    DontMiss.prototype.swap_page = function(container) {
        $('.hero-unit').children().remove();
        $('.hero-unit').append(container);
    };

    /**************************************************
     * utils */
    function get(url) {
        return $.ajax({url: url, dataType: 'json'});
    }

    function put(url, data) {
        return $.ajax({url: url, dataType: 'json', data: data});
    }

    function map(fn, data) {
        var a = [];
        for(var i=0, j=data.length; i<j; i++) { a.push(fn(data[i])); }
        return a;
    }

    function filter(fn, data) {
        var a = [];
        for(var i=0, j=data.length; i<j; i++) {
            if(fn(data[i])) {
                a.push(data[i]);
            }
        }
        return a;
    }

    function sum(data) {
        for (var i=0, j=data.length, s=0; i<j; i++) {
            s += data[i];
        }
        return s;
    }

    $(document).ready(function() {
        window.DM = new DontMiss();
        //DM.login('matt@freshplum.com');
    });
}(jQuery));
