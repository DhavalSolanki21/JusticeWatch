from rest_framework import permissions

class IsJudgeOrAdmin(permissions.BasePermission):
    """
    Allows access only to users with role JUDGE or ADMIN.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['JUDGE', 'ADMIN'])

class IsLawyer(permissions.BasePermission):
    """
    Allows access only to users with role LAWYER.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'LAWYER')
