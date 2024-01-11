from django.shortcuts import render, get_object_or_404
from .models import Post
from django.http import Http404

# Create your views here.

def post_list(request):
    posts = Post.published.all()
    return render(request,
                  'mangablog/post/detail.html',
                  {'posts': posts}
                  )
    
def post_detail(request, id):
    
    """
    #same method as get_object_or_404's
    try:
        post= Post.published.get(id = id)
        
    except Post.DoesNotExist:
        raise Http404("Post not found")
        
    """
    post = get_object_or_404(
        Post,
        id=id,
        status=Post.Status.PUBLISHED
    )
    
    return render(request,
                  'mangablog/post/detail.html',
                  {'post': post}
                  )