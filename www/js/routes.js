var routes = [
    {
        path: '/',
        url: './index.html',
        name: 'home'
    },
    {
        path: '/settings/',
        url: './pages/settings.html',
        name: 'settings'
    },
    {
        path: '/createEvent/',
        url: './pages/createEvent.html',
        name: 'createEvent'
    },
    {
        path: '/readUpdateEvent/',
        url: './pages/readUpdateEvent.html',
        name: 'readUpdateEvent'
    },
    {
        path: '/readProfile/',
        url: './pages/readProfile.html',
        name: 'readProfile'
    },
    {
        path: '/readWishlist/',
        url: './pages/readWishlist.html',
        name: 'readWishlist'
    },
    {
        path: '/updateProfile/',
        url: './pages/updateProfile.html',
        name: 'updateProfile'
    },
    {
        path: '/updateWishlist/',
        url: './pages/updateWishlist.html',
        name: 'updateWishlist'
    },
    {
        path: '/dynamic-route/blog/:blogId/post/:postId/',
        componentUrl: './pages/dynamic-route.html',
    },
    {
        path: '/request-and-load/user/:userId/',
        async: function (routeTo, routeFrom, resolve, reject) {
            // Router instance
            var router = this;
        
            // App instance
            var app = router.app;
        
            // Show Preloader
            app.preloader.show();
        
            // User ID from request
            var userId = routeTo.params.userId;
        
            // Simulate Ajax Request
            setTimeout(function () {
                // We got user data from request
                var user = {
                firstName: 'Vladimir',
                lastName: 'Kharlampidi',
                about: 'Hello, i am creator of Framework7! Hope you like it!',
                links: [
                    {
                    title: 'Framework7 Website',
                    url: 'http://framework7.io',
                    },
                    {
                    title: 'Framework7 Forum',
                    url: 'http://forum.framework7.io',
                    },
                ]
                };
                // Hide Preloader
                app.preloader.hide();
        
                // Resolve route to load page
                resolve(
                {
                    componentUrl: './pages/request-and-load.html',
                },
                {
                    context: {
                    user: user,
                    }
                }
                );
            }, 1000);
        },
    },
    
      // Default route (404 page). MUST BE THE LAST
    {
        path: '(.*)',
        url: './pages/404.html',
    },
];