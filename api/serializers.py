from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, Reaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at']

class ReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'reaction_type', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    flames_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'image', 'author', 'created_at', 'comments', 'likes_count', 'flames_count']
        
        
    def get_likes_count(self, obj):
        return obj.reactions.filter(reaction_type='like').count()
        
    def get_flames_count(self, obj):
        return obj.reactions.filter(reaction_type='flame').count()

    def get_image(self, obj):
        if obj.image:
            img_path = str(obj.image)
            if img_path.startswith('assets/'):
                return img_path
            return f"http://127.0.0.1:8000/media/{img_path}"
        return None
