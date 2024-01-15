** Creating a urls.py file for each application is the best way to make your applications reusable by other projects **

Always use the {% url %} template tag to build URLs in your templates instead of writing hardcoded URLs. This will make your URLs more maintainable

Canonical URLs allow you to specify the URL for the master copy of a page. Django allows you to implement the get_absolute_url() method in your models to return the canonical URL for the object.