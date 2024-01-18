from django.shortcuts import render, get_object_or_404
from .models import Post
from django.views.generic import ListView
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from .form import EmailPostForm
from django.core.mail import send_mail

# Create your views here.

def post_share(request, post_id):
    post = get_object_or_404(Post, id=post_id, status=Post.Status.PUBLISHED)
    sent = False
    
    if request.method == 'POST':
        form =  EmailPostForm(request.POST) # Form was submitted
        
        if form.is_valid():
            cd = form.cleaned_data  # Form fields passed validation
            post_url = request.build_absolute_uri(post.get_absolute_url())
            subject = f"{cd['name']} recommands you read" \
                f"{post.title}"
            message = f"Read {post.title} at {post_url}\n\n" \
                f"{cd['name']}\ s comments: {cd['comments']}"
            send_mail(subject, message, 'lucedia09@gmail.com', [cd['to']])
            
            sent = True    
                
    else:
        form = EmailPostForm()
    return render(request,
                  'blog/post/share.html',
                  {'post':post,
                   'form':form,
                   'sent':sent})
    
class PostListView(ListView):
    """ Alternative post list view """
    queryset = Post.published.all()
    context_object_name = 'posts'
    paginate_by = 3
    template_name = 'blog/post/list.html'
    
def post_list(request):
    
    post_list = Post.published.all()
    
    #Pagination with 3 post per page 
    paginator = Paginator(post_list, 3)
    page_number = request.GET.get('page', 1)
    
    try:
        posts = paginator.page(page_number)
        
    except PageNotAnInteger:  # If page_number is not an integer deliver the first page
        posts = paginator.page(1)
        
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)  # If page_number is out of range deliver last page of results
    return render(request,
                  'blog/post/list.html',
                  {'posts': posts}
                  )
    
def post_detail(request, year, month, day, post):
    post = get_object_or_404(Post,
        status=Post.Status.PUBLISHED,
        slug=post,
        publish__year=year,
        publish__month=month,
        publish__day=day,
    )
    
    return render(request,
                  'blog/post/detail.html',
                  {'post': post}
                  )