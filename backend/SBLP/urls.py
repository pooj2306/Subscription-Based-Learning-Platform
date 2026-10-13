"""
URL configuration for SBLP project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse, HttpResponse

def api_root(request):
    if 'text/html' in request.META.get('HTTP_ACCEPT', ''):
        html_content = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SBLP Backend API Service</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background: #f8fafc;
                    color: #1e293b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 36px;
                    max-width: 600px;
                    width: 100%;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
                }
                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #ecfdf5;
                    color: #047857;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 4px 12px;
                    border-radius: 9999px;
                    margin-bottom: 16px;
                }
                .badge-dot {
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                }
                h1 {
                    font-size: 24px;
                    font-weight: 800;
                    margin: 0 0 8px 0;
                    color: #0f172a;
                }
                p {
                    font-size: 14px;
                    line-height: 1.6;
                    color: #64748b;
                    margin: 0 0 24px 0;
                }
                .btn {
                    display: inline-block;
                    background: #2563eb;
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 14px;
                    padding: 12px 24px;
                    border-radius: 10px;
                    text-decoration: none;
                    transition: background 0.2s;
                    box-shadow: 0 2px 4px rgba(37,99,235,0.2);
                }
                .btn:hover {
                    background: #1d4ed8;
                }
                .endpoints {
                    margin-top: 28px;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 20px;
                }
                .endpoints h2 {
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #94a3b8;
                    margin: 0 0 12px 0;
                }
                .endpoint-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                .endpoint-list a {
                    font-size: 13px;
                    color: #3b82f6;
                    text-decoration: none;
                    font-family: monospace;
                    padding: 6px 10px;
                    background: #f8fafc;
                    border-radius: 6px;
                    display: block;
                }
                .endpoint-list a:hover {
                    background: #eff6ff;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="badge">
                    <span class="badge-dot"></span> Backend API Online
                </div>
                <h1>SBLP Backend REST API</h1>
                <p>
                    You are visiting the Django REST API server on <strong>port 8000</strong>.
                    To use the web application (courses, lessons, adaptive quizzes, and student dashboard), open the <strong>Frontend UI</strong>.
                </p>
                <a href="http://127.0.0.1:5173" class="btn">🚀 Open Web App (http://127.0.0.1:5173)</a>

                <div class="endpoints">
                    <h2>Available API Endpoints</h2>
                    <ul class="endpoint-list">
                        <li><a href="/api/courses/">/api/courses/</a></li>
                        <li><a href="/api/adaptive/diagnostics/">/api/adaptive/diagnostics/</a></li>
                        <li><a href="/api/subscriptions/">/api/subscriptions/</a></li>
                        <li><a href="/api/progress/">/api/progress/</a></li>
                        <li><a href="/api/assessments/">/api/assessments/</a></li>
                        <li><a href="/admin/">/admin/</a></li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
        """
        return HttpResponse(html_content)

    return JsonResponse({
        "status": "online",
        "service": "Subscription-Based Learning Platform (SBLP) API",
        "frontend_url": "http://127.0.0.1:5173",
        "endpoints": {
            "admin": "/admin/",
            "accounts": "/api/accounts/",
            "courses": "/api/courses/",
            "subscriptions": "/api/subscriptions/",
            "progress": "/api/progress/",
            "assessments": "/api/assessments/",
            "certificates": "/api/certificates/",
            "dashboard": "/api/dashboard/",
            "adaptive_learning": "/api/adaptive/",
            "engagement": "/api/engagement/",
        },
        "message": "To view the web app interface, please open http://127.0.0.1:5173"
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/progress/', include('progress.urls')),
    path('api/assessments/', include('assessments.urls')),
    path('api/certificates/', include('certificates.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/adaptive/', include('adaptive_learning.urls')),
    path('api/engagement/', include('engagement.urls')),
]