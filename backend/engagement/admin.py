from django.contrib import admin
from .models import (
    GamificationProfile,
    XPTransaction,
    Badge,
    EarnedBadge,
    StudyGroup,
    StudyGroupMembership,
    StudyGroupMessage,
    Roadmap,
    RoadmapNode,
    FocusSession,
)


@admin.register(GamificationProfile)
class GamificationProfileAdmin(admin.ModelAdmin):
    list_display = ('student', 'xp', 'level', 'current_streak', 'longest_streak', 'total_focus_minutes')
    search_fields = ('student__username', 'student__email')


@admin.register(XPTransaction)
class XPTransactionAdmin(admin.ModelAdmin):
    list_display = ('student', 'amount', 'reason', 'created_at')
    list_filter = ('created_at',)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('icon', 'title', 'code', 'category', 'xp_reward')
    list_filter = ('category',)


@admin.register(EarnedBadge)
class EarnedBadgeAdmin(admin.ModelAdmin):
    list_display = ('student', 'badge', 'earned_at')
    list_filter = ('badge', 'earned_at')


class StudyGroupMembershipInline(admin.TabularInline):
    model = StudyGroupMembership
    extra = 1


@admin.register(StudyGroup)
class StudyGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'created_by', 'target_weekly_xp', 'current_weekly_xp', 'goal_progress_percent')
    inlines = [StudyGroupMembershipInline]


@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'category', 'is_active', 'order')
    prepopulated_fields = {'slug': ('title',)}


@admin.register(RoadmapNode)
class RoadmapNodeAdmin(admin.ModelAdmin):
    list_display = ('roadmap', 'stage_order', 'course', 'skill_tag', 'reward_xp')
    list_filter = ('roadmap',)


@admin.register(FocusSession)
class FocusSessionAdmin(admin.ModelAdmin):
    list_display = ('student', 'duration_minutes', 'mode', 'course', 'xp_earned', 'completed_at')
    list_filter = ('mode', 'completed_at')
