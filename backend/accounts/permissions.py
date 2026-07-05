from rest_framework import permissions

class IsJudge(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'judge' and 
            request.user.is_verified
        )

class IsLawyer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'lawyer' and 
            request.user.is_verified
        )

class IsJudgeOrReadOnlyForLawyer(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_verified):
            return False
            
        if request.user.role == 'judge':
            return True
            
        if request.user.role == 'lawyer':
            return request.method in permissions.SAFE_METHODS
            
        return False
        
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'judge':
            return True
            
        if request.user.role == 'lawyer' and request.method in permissions.SAFE_METHODS:
            # Check if this lawyer is assigned to this specific case.
            # We assume obj is a Case instance.
            return obj.caseassignment_set.filter(lawyer=request.user).exists()
            
        return False
