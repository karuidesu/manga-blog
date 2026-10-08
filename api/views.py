from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Post, Comment, Reaction
from .serializers import PostSerializer, CommentSerializer, ReactionSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def react(self, request, pk=None):
        post = self.get_object()
        reaction_type = request.data.get('reaction_type')
        if reaction_type not in ['like', 'flame']:
            return Response({'error': 'Invalid reaction type'}, status=status.HTTP_400_BAD_REQUEST)
        
        reaction, created = Reaction.objects.get_or_create(
            post=post, user=request.user, reaction_type=reaction_type
        )
        if not created:
            reaction.delete()
            return Response({'status': f'{reaction_type} removed'}, status=status.HTTP_200_OK)
            
        return Response({'status': f'{reaction_type} added'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comment(self, request, pk=None):
        post = self.get_object()
        content = request.data.get('content')
        if not content:
            return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        comment = Comment.objects.create(post=post, author=request.user, content=content)
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)
