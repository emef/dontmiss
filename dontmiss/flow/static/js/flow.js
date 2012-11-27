var docCookies = {
  getItem: function (sKey) {
    if (!sKey || !this.hasItem(sKey)) { return null; }
    return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Tue, 19 Jan 2038 03:14:07 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toGMTString();
          break;
      }
    }
    document.cookie = escape(sKey) + "=" + escape(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
  },
  removeItem: function (sKey, sPath) {
    if (!sKey || !this.hasItem(sKey)) { return; }
    document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sPath ? "; path=" + sPath : "");
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = unescape(aKeys[nIdx]); }
    return aKeys;
  }
};

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
            ul.find('> li').on('click.activate', function() {
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
                return function(e) {
                    e.preventDefault();
                    dm.show_history(user);
                }
            }(user)));
        }
    };

    DontMiss.prototype.view_links = function() {
        var dm = this
          , clickfn = function(view) {
              return function() {
                  dm.show_view(view);
              };
          };
        $('#schedule').on('click', clickfn('schedule'));
        $('#total').on('click', clickfn('total'));
        $('#unpaid').on('click', clickfn('unpaid'));
        $('#report').on('click', clickfn('report'));
    };

    DontMiss.prototype.login = function(email) {
        var dm = this;
        this.email = email;
        $('#login').fadeOut('fast', function() {
            dm.main();
            docCookies.setItem('email', email, 60 * 60 * 24 * 3);
        });
    };

    DontMiss.prototype.main = function() {
        this.history_links();
        this.view_links();
        this.sidebar();
        $('#schedule').trigger('click');
        $('.username').text(this.email);
        $('#main').fadeIn('fast');
        $('a#unpaid').trigger('click');
    };

    DontMiss.prototype.my_tickets = function () {
        var tickets = [];
        for (var i=0; i<this.tickets.length; i++) {
            if (this.tickets[i].member.email === this.email) {
                tickets.push(this.tickets[i]);
            }
        }
        return tickets;
    };

    DontMiss.prototype.show_history = function(user) {
        var div = $('<div />')
          , dl = $('<dl class="dl-horizontal"/>')
          , tickets = filter(function(t) { return t.user.id === user.id }, this.tickets)
          , contribution = sum(map(function(t) { return t.workout.amount }, tickets))
          , attendance = this.tickets.length
                             ? parseInt(100 * (1 - tickets.length / this.tickets.length))
                             : 100;

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

    DontMiss.prototype.show_view = function(view) {
        var view_fn = ({
            schedule: this.schedule_view,
            total: this.total_view,
            unpaid: this.unpaid_view,
            report: this.report_view
        })[view];

        if (view_fn) {
            var view_div = view_fn.apply(this);
            this.swap_page(view_div);
        }

    };

    DontMiss.prototype.schedule_view = function() {
        var div = $('<div />')
          , workout_container = $('<div />')
          , workouts = filter(compose(is_this_week, gen_getattr('dt')), this.workouts);

        for (var day = this_monday(); day <= this_sunday(); day = add_days(day, 1)) {
            var workout = match_workout(day, workouts)
              , day_div = $('<div />').addClass('day');

            day_div.append(day_of_week_div(day));

            if (workout) {
                var details = $('<div />')
                  , extra = $('<div />')
                  , price = $('<div />');

                details.append($('<div>%s</div>'.format(workout.type)));
                details.append($('<div>%s</div>'.format(time(workout.dt))));
                details.addClass('details');

                extra.append($('<div>%s</div>'.format(workout.note)));
                extra.addClass('extra');

                price.text('$%s'.format(workout.amount));
                price.addClass('price');

                day_div.addClass('workout');
                day_div.append(price);
                day_div.append(details);
                day_div.append(extra);
            }
            workout_container.append(day_div);
        }

        div.append($('<h2>%s</h2>'.format('This Week\'s Schedule')));
        div.append(workout_container);
        return div;
    };

    DontMiss.prototype.total_view = function() {
        var div = $('<div />')
          , total = 0
          , members = {}
          , unique = 0;

        for (var i=0; i<this.tickets.length; i++) {
            if (this.tickets[i].paid) {
                var member = this.tickets[i].user.name;
                total += this.tickets[i].workout.amount;
                if (!members[member]) {
                    unique += 1;
                    members[member] = true;
                }
            }
        }

        div.append($('<h2>%s</h2>'.format('Pot Total')));
        div.append($('<h4>$%s from %s members</h4>'.format(total, unique)));
        return div;
    };

    DontMiss.prototype.unpaid_view = function() {
        var div = $('<div />')
          , dm = this
          , ticket = null
          , my_tickets = filter(function(t) {
              return t.user.email === dm.email
          }, this.tickets);

        div.append($('<h2>%s</h2>'.format('Unpaid Tickets')));

        for (var i=0; i<my_tickets.length; i++) {
            ticket = ticket_div(my_tickets[i]);
            ticket.find('button').on('click', (function(ticket) {
                return function() {
                    var sku = ticket.sku;
                    if (Helium.cart.get().indexOf(sku) === -1) {
                        Helium.cart.add(sku, 1);
                    }
                }
            }(my_tickets[i])));
            div.append(ticket);
            if (i !== my_tickets.length-1) {
                div.append($('<hr />'));
            }
        }

        return div;
    };

    DontMiss.prototype.report_view = function() {
        var div = $('<div />');

        div.append($('<h2>%s</h2>'.format('Report a Slacker')));
        return div;
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

    function compose() {
        var fns = Array.prototype.slice.call(arguments);
        return function() {
            var args = arguments, val;
            for (var i=fns.length-1; i>=0; i--) {
                val = fns[i].apply(this, args);
                args = [val];
            }
            return val;
        }
    }

    function gen_getattr(key) {
        return function(obj) {
            return obj[key];
        };
    }

    function is_this_week(dt) {
        var dt = ensure_dt(dt)
          , nearest_monday = this_monday()
          , nearest_sunday = this_sunday();

        return (dt >= nearest_monday) && (dt <= nearest_sunday);
    }

    function this_monday() {
        var today = this_day()
          , day = today.getDay()
          , days_back = (day == 0) ? 6 : day - 1
          , monday = add_days(today, -days_back);
        monday.setHours(0);
        monday.setMinutes(0);
        return monday;
    }

    function this_sunday() {
        var today = this_day()
          , day = today.getDay()
          , days_ahead = (day == 0) ? 0 : 7 - day
          , sunday = add_days(today, days_ahead);
        sunday.setHours(23);
        sunday.setMinutes(59);
        return sunday;
    }

    function this_day() {
        var today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    function add_days(dt, days) {
        var day = 1000 * 60 * 60 * 24;
        return new Date(dt.getTime() + day * days);
    }

    function day_of_week(dt) {
        var strs = ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'];
        return strs[dt.getDay()];
    }

    function time(dt) {
        var dt = ensure_dt(dt)
          , hour = dt.getHours()
          , minute = dt.getMinutes()
          , stamp = null;
        stamp = (hour > 12) ? 'pm' : 'am';
        hour = (hour > 12) ? hour - 12 : hour;
        hour = (hour == 0) ? 12 : hour;
        if (minute < 10) {
            minute = '0' + minute.toString();
        }
        return '%s:%s%s'.format(hour, minute, stamp);
    }

    function ensure_dt(dt) {
        if (typeof(dt) === typeof('')) {
            return new Date(dt);
        } else {
            return dt;
        }
    }

    function proper_str(str) {
        return '%s%s'.format(str[0].toUpperCase(), str.substr(1));
    }

    function match_workout(day, workouts) {
        for(var i=0; i<workouts.length; i++) {
            if (ensure_dt(workouts[i].dt).getDate() === day.getDate()) {
                return workouts[i];
            }
        }
    }

    function day_of_week_div(dt) {
        return $('<div class="day_of_week">%s</div>'.format(day_of_week(dt)));
    }

    function ticket_div(ticket) {
        var div = $('<div class="ticket" />')
          , dt = ensure_dt(ticket.workout.dt);
        div.append($('<h4>%s on %s</h4>'.format(proper_str(ticket.workout.type),
                                                dt.toDateString())));
        div.append($('<span>$%s</span>'.format(ticket.workout.amount)));
        div.append($('<button class="helium-buy-now">Pay Ticket</button>'));
        return div;
    }

    window.fn = ensure_dt;

    $(document).ready(function() {
        window.DM = new DontMiss();
        if (docCookies.hasItem('email')) {
            DM.login(docCookies.getItem('email'));
        }
    });
}(jQuery));
