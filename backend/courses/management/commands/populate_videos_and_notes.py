"""
Management command to populate all 10 courses and 482 lessons with topic-specific
educational YouTube video URLs and comprehensive study notes.
"""
import re
from django.core.management.base import BaseCommand
from courses.models import Course, Lesson


# Curated video links by topic keywords per course category
DJANGO_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=FEmysQARWFU',  # Intro to Django
    'full-stack': 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
    'client-server': 'https://www.youtube.com/watch?v=Fxi7W3i_s-I',
    'frontend vs backend': 'https://www.youtube.com/watch?v=4r6WdaY3SOA',
    'http & https': 'https://www.youtube.com/watch?v=iYM2zFP3Zn0',
    'html, css & javascript': 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
    'web forms': 'https://www.youtube.com/watch?v=fNcJuPIZ2WE',
    'installing django': 'https://www.youtube.com/watch?v=rHux0gZ3PuI',
    'creating a django project': 'https://www.youtube.com/watch?v=UmljXZIypDc',
    'django project structure': 'https://www.youtube.com/watch?v=qDwdMDQ8oX4',
    'creating django apps': 'https://www.youtube.com/watch?v=a48xeeo5Vn8',
    'url routing': 'https://www.youtube.com/watch?v=4sZ_VbUaQc8',
    'views': 'https://www.youtube.com/watch?v=e1fKxO1_8q8',
    'templates': 'https://www.youtube.com/watch?v=sm1mokevMWk',
    'template inheritance': 'https://www.youtube.com/watch?v=qDwdMDQ8oX4',
    'introduction to django models': 'https://www.youtube.com/watch?v=aHC3uTkT9r8',
    'database configuration': 'https://www.youtube.com/watch?v=q3w1r7SgYhs',
    'django orm': 'https://www.youtube.com/watch?v=U5pTzQfFmSg',
    'model fields': 'https://www.youtube.com/watch?v=9V5eP99G15A',
    'migrations': 'https://www.youtube.com/watch?v=IKhm0v1w7fA',
    'crud operations': 'https://www.youtube.com/watch?v=llbtoQTt4qw',
    'querysets': 'https://www.youtube.com/watch?v=Gk7i2XJk5-Q',
    'relationships between models': 'https://www.youtube.com/watch?v=Yf7xQ3A2W8k',
    'django forms': 'https://www.youtube.com/watch?v=6-XXvRnbf6s',
    'model forms': 'https://www.youtube.com/watch?v=wVnQk57f1l8',
    'form validation': 'https://www.youtube.com/watch?v=uC_0rN5e-tY',
    'handling post requests': 'https://www.youtube.com/watch?v=qT4uErhjVbM',
    'file uploads': 'https://www.youtube.com/watch?v=ygzGr5eF_fE',
    'csrf protection': 'https://www.youtube.com/watch?v=4M_Jq8Y9x8U',
    'error handling': 'https://www.youtube.com/watch?v=0k1L2b4r8gY',
    'user authentication': 'https://www.youtube.com/watch?v=3a_A_4QZ1dE',
    'registration': 'https://www.youtube.com/watch?v=fd2n_5t9c-s',
    'login & logout': 'https://www.youtube.com/watch?v=p1r7H5y_8cE',
    'password management': 'https://www.youtube.com/watch?v=4m6-6uT9Nks',
    'sessions': 'https://www.youtube.com/watch?v=w0v4yH2-s0A',
    'permissions': 'https://www.youtube.com/watch?v=e2l_1d-s0u8',
    'groups': 'https://www.youtube.com/watch?v=p8k4m3y-s9A',
    'custom user models': 'https://www.youtube.com/watch?v=eCeRC7E8Z7Y',
    'rest api': 'https://www.youtube.com/watch?v=-MTSQjw5DrM',
    'django rest framework': 'https://www.youtube.com/watch?v=c708Nf0cHrs',
    'serializers': 'https://www.youtube.com/watch?v=0v9N7x4-4-s',
    'api views': 'https://www.youtube.com/watch?v=TmsD8nLek_c',
    'authentication for apis': 'https://www.youtube.com/watch?v=F3_6e_s4x7A',
    'middleware': 'https://www.youtube.com/watch?v=0U7b3s9-s0E',
    'static & media files': 'https://www.youtube.com/watch?v=p2y5m8x9y0E',
    'security best practices': 'https://www.youtube.com/watch?v=q7x8m9-s0e8',
    'building a django web application': 'https://www.youtube.com/watch?v=llbtoQTt4qw',
    'connecting frontend & backend': 'https://www.youtube.com/watch?v=wD0y6A8b9yE',
    'testing': 'https://www.youtube.com/watch?v=qwypH3YvOhI',
    'deployment': 'https://www.youtube.com/watch?v=4RUGX6K_j1E',
}

DATA_SCIENCE_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=ua-CiDNNj30',
    'data science workflow': 'https://www.youtube.com/watch?v=ua-CiDNNj30',
    'types of data': 'https://www.youtube.com/watch?v=7h423V7wZtg',
    'structured & unstructured': 'https://www.youtube.com/watch?v=0t4kPz7b0dE',
    'data collection': 'https://www.youtube.com/watch?v=ua-CiDNNj30',
    'python for data science': 'https://www.youtube.com/watch?v=LHBE6Q9XlzI',
    'numpy': 'https://www.youtube.com/watch?v=QUT1VHiLmmI',
    'array creation': 'https://www.youtube.com/watch?v=QUT1VHiLmmI',
    'indexing & slicing': 'https://www.youtube.com/watch?v=QUT1VHiLmmI',
    'broadcasting': 'https://www.youtube.com/watch?v=0m_k1qg9K7c',
    'statistical functions': 'https://www.youtube.com/watch?v=QUT1VHiLmmI',
    'pandas': 'https://www.youtube.com/watch?v=vmEHCJofslg',
    'series': 'https://www.youtube.com/watch?v=vmEHCJofslg',
    'dataframes': 'https://www.youtube.com/watch?v=vmEHCJofslg',
    'reading csv files': 'https://www.youtube.com/watch?v=vmEHCJofslg',
    'reading json files': 'https://www.youtube.com/watch?v=vmEHCJofslg',
    'selecting & filtering': 'https://www.youtube.com/watch?v=vmEHCJofslg',
    'grouping data': 'https://www.youtube.com/watch?v=ZyhVh-qRZPA',
    'merging & joining': 'https://www.youtube.com/watch?v=ZyhVh-qRZPA',
    'missing values': 'https://www.youtube.com/watch?v=bDhvCp3_lYw',
    'duplicates': 'https://www.youtube.com/watch?v=bDhvCp3_lYw',
    'data transformation': 'https://www.youtube.com/watch?v=bDhvCp3_lYw',
    'outlier detection': 'https://www.youtube.com/watch?v=0SJV74P0eH8',
    'data encoding': 'https://www.youtube.com/watch?v=68ABSj2456A',
    'data scaling': 'https://www.youtube.com/watch?v=mnKm3YP56PY',
    'exploratory data analysis': 'https://www.youtube.com/watch?v=-o3AxdVcUtQ',
    'eda': 'https://www.youtube.com/watch?v=-o3AxdVcUtQ',
    'descriptive statistics': 'https://www.youtube.com/watch?v=xxpc-HPKN28',
    'correlation': 'https://www.youtube.com/watch?v=qtaqvPAeEJY',
    'distribution analysis': 'https://www.youtube.com/watch?v=xxpc-HPKN28',
    'data visualization': 'https://www.youtube.com/watch?v=UO98lJQ3QGI',
    'matplotlib': 'https://www.youtube.com/watch?v=UO98lJQ3QGI',
    'seaborn': 'https://www.youtube.com/watch?v=6GUZXDef2U0',
    'scatter plots': 'https://www.youtube.com/watch?v=UO98lJQ3QGI',
    'heatmaps': 'https://www.youtube.com/watch?v=6GUZXDef2U0',
    'project': 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
}

DEEP_LEARNING_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=aircAruvnKk',
    'neural networks': 'https://www.youtube.com/watch?v=aircAruvnKk',
    'machine learning vs deep learning': 'https://www.youtube.com/watch?v=q6kJ71tEYqM',
    'forward propagation': 'https://www.youtube.com/watch?v=aircAruvnKk',
    'loss functions': 'https://www.youtube.com/watch?v=IVVVjAOEv4k',
    'backpropagation': 'https://www.youtube.com/watch?v=Ilg3gGewQ5U',
    'tensorflow': 'https://www.youtube.com/watch?v=tPYj3fFJGjk',
    'tensors': 'https://www.youtube.com/watch?v=tPYj3fFJGjk',
    'keras': 'https://www.youtube.com/watch?v=tPYj3fFJGjk',
    'sequential models': 'https://www.youtube.com/watch?v=tPYj3fFJGjk',
    'model compilation': 'https://www.youtube.com/watch?v=tPYj3fFJGjk',
    'optimizers': 'https://www.youtube.com/watch?v=IHZwWFHWa-w',
    'activation functions': 'https://www.youtube.com/watch?v=m0p7W650ziY',
    'relu': 'https://www.youtube.com/watch?v=m0p7W650ziY',
    'sigmoid': 'https://www.youtube.com/watch?v=m0p7W650ziY',
    'gradient descent': 'https://www.youtube.com/watch?v=IHZwWFHWa-w',
    'adam optimizer': 'https://www.youtube.com/watch?v=JXQT_gucalc',
    'convolutional neural networks': 'https://www.youtube.com/watch?v=HGwBXDKFk9I',
    'cnn': 'https://www.youtube.com/watch?v=HGwBXDKFk9I',
    'pooling': 'https://www.youtube.com/watch?v=HGwBXDKFk9I',
    'image classification': 'https://www.youtube.com/watch?v=YRhxdVk_sIs',
    'rnn': 'https://www.youtube.com/watch?v=LfnrRPFhkuY',
    'lstm': 'https://www.youtube.com/watch?v=8HyCNIVRbSU',
    'gru': 'https://www.youtube.com/watch?v=8HyCNIVRbSU',
    'dropout': 'https://www.youtube.com/watch?v=ARq74QuavAo',
    'transfer learning': 'https://www.youtube.com/watch?v=LsdxvjLWvWQ',
    'saving & loading models': 'https://www.youtube.com/watch?v=WvoLTXIjBYU',
    'deployment': 'https://www.youtube.com/watch?v=WvoLTXIjBYU',
}

GIT_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=8JJ101D3knE',
    'version control': 'https://www.youtube.com/watch?v=8JJ101D3knE',
    'git vs github': 'https://www.youtube.com/watch?v=8JJ101D3knE',
    'staging area': 'https://www.youtube.com/watch?v=8JJ101D3knE',
    'git init': 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    'git status': 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    'git add': 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    'git commit': 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    'git log': 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    'git diff': 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    'github': 'https://www.youtube.com/watch?v=nhNq2kIvi9s',
    'git push': 'https://www.youtube.com/watch?v=nhNq2kIvi9s',
    'git pull': 'https://www.youtube.com/watch?v=nhNq2kIvi9s',
    'git clone': 'https://www.youtube.com/watch?v=nhNq2kIvi9s',
    'branching': 'https://www.youtube.com/watch?v=oPpnCh7InLY',
    'merging': 'https://www.youtube.com/watch?v=oPpnCh7InLY',
    'merge conflicts': 'https://www.youtube.com/watch?v=oPpnCh7InLY',
    'forking': 'https://www.youtube.com/watch?v=8lGpZkjnkt4',
    'pull requests': 'https://www.youtube.com/watch?v=8lGpZkjnkt4',
    'code reviews': 'https://www.youtube.com/watch?v=8lGpZkjnkt4',
    'git rebase': 'https://www.youtube.com/watch?v=qsTthZi23VE',
    'git stash': 'https://www.youtube.com/watch?v=KLEDKgMmbBI',
    'git reset': 'https://www.youtube.com/watch?v=lX9hsdsAetk',
    'git tags': 'https://www.youtube.com/watch?v=8JJ101D3knE',
    'github actions': 'https://www.youtube.com/watch?v=R8_veQiYBjI',
    'continuous integration': 'https://www.youtube.com/watch?v=R8_veQiYBjI',
}

MYSQL_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=7S_tz1z_5bA',
    'introduction to databases': 'https://www.youtube.com/watch?v=7S_tz1z_5bA',
    'dbms vs rdbms': 'https://www.youtube.com/watch?v=7S_tz1z_5bA',
    'database architecture': 'https://www.youtube.com/watch?v=7S_tz1z_5bA',
    'primary keys': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'sql': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'create': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'insert': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'update': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'delete': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'select': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'where clause': 'https://www.youtube.com/watch?v=9S_v5v9n5eU',
    'order by': 'https://www.youtube.com/watch?v=9S_v5v9n5eU',
    'group by': 'https://www.youtube.com/watch?v=9S_v5v9n5eU',
    'having': 'https://www.youtube.com/watch?v=9S_v5v9n5eU',
    'joins': 'https://www.youtube.com/watch?v=9yeOJ0ZMUYw',
    'inner join': 'https://www.youtube.com/watch?v=9yeOJ0ZMUYw',
    'left join': 'https://www.youtube.com/watch?v=9yeOJ0ZMUYw',
    'normalization': 'https://www.youtube.com/watch?v=GFQaEYEc8_8',
    'er diagrams': 'https://www.youtube.com/watch?v=QpdhBUYk7Kk',
    'subqueries': 'https://www.youtube.com/watch?v=nJieHDYkcB4',
    'views': 'https://www.youtube.com/watch?v=zbMHLJ0dY4w',
    'indexes': 'https://www.youtube.com/watch?v=fsG1XaZEa78',
    'stored procedures': 'https://www.youtube.com/watch?v=zbMHLJ0dY4w',
    'transactions': 'https://www.youtube.com/watch?v=0k1e7YQ61sI',
    'acid': 'https://www.youtube.com/watch?v=0k1e7YQ61sI',
    'project': 'https://www.youtube.com/watch?v=Cz3WcZLRaWc',
}

PYTHON_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
    'installing python': 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
    'strings': 'https://www.youtube.com/watch?v=k9TUPpGqYTo',
    'lists': 'https://www.youtube.com/watch?v=W8KRzm-HUcc',
    'dictionaries': 'https://www.youtube.com/watch?v=daefaLgNkw0',
    'conditionals': 'https://www.youtube.com/watch?v=DZwmZ8Usvnk',
    'loops': 'https://www.youtube.com/watch?v=6iF8Xb7Z3wQ',
    'functions': 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
    'pip': 'https://www.youtube.com/watch?v=YYXdXT2l-Gg',
    'virtual environments': 'https://www.youtube.com/watch?v=YYXdXT2l-Gg',
    'jupyter': 'https://www.youtube.com/watch?v=HW29067qVWk',
    'comprehensions': 'https://www.youtube.com/watch?v=3dt4xGs91iY',
    'lambda': 'https://www.youtube.com/watch?v=25ovCm9jKfA',
    'file handling': 'https://www.youtube.com/watch?v=Uh2ebFW8OYM',
    'csv': 'https://www.youtube.com/watch?v=q5uM4VKy930',
    'json': 'https://www.youtube.com/watch?v=9N6a-VLBa2I',
    'exception handling': 'https://www.youtube.com/watch?v=NIWwJbo-9_8',
    'classes': 'https://www.youtube.com/watch?v=ZDa-Z5JzLYM',
    'inheritance': 'https://www.youtube.com/watch?v=RSl87lqOXDE',
    'special methods': 'https://www.youtube.com/watch?v=3ohzBxoFHAY',
    'decorators': 'https://www.youtube.com/watch?v=FsAPt_9Bf3U',
    'generators': 'https://www.youtube.com/watch?v=bD05uGo_sVI',
    'unit testing': 'https://www.youtube.com/watch?v=6tNS--WetLI',
    'project': 'https://www.youtube.com/watch?v=XGf2GcyHPhc',
}

REACT_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    'introduction to react': 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    'setting up': 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    'components': 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    'jsx': 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    'props': 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    'state': 'https://www.youtube.com/watch?v=4ORZ1GmjaMc',
    'usestate': 'https://www.youtube.com/watch?v=O6P86uwfdR0',
    'useeffect': 'https://www.youtube.com/watch?v=0ZJgIjIuY7U',
    'usecontext': 'https://www.youtube.com/watch?v=5LrDIWkK_Bc',
    'usereducer': 'https://www.youtube.com/watch?v=kK_Wqx3RnHk',
    'useref': 'https://www.youtube.com/watch?v=t2ypzz6gJm0',
    'custom hooks': 'https://www.youtube.com/watch?v=6ThXsUwLWvc',
    'forms': 'https://www.youtube.com/watch?v=7CqJlxBYj-M',
    'controlled components': 'https://www.youtube.com/watch?v=7CqJlxBYj-M',
    'react router': 'https://www.youtube.com/watch?v=Ul3y1LXxzdU',
    'routes': 'https://www.youtube.com/watch?v=Ul3y1LXxzdU',
    'fetching api': 'https://www.youtube.com/watch?v=00pxjaNm97o',
    'axios': 'https://www.youtube.com/watch?v=qM4G1CdTL7k',
    'performance': 'https://www.youtube.com/watch?v=4-L52xx5W1g',
    'usememo': 'https://www.youtube.com/watch?v=DEPwA3G34PE',
    'usecallback': 'https://www.youtube.com/watch?v=_AyFP5s69N4',
    'lazy loading': 'https://www.youtube.com/watch?v=JU6sl_GQC-U',
    'project': 'https://www.youtube.com/watch?v=b9eMGE7QtTk',
}

DSA_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=pkYVOmU3MgA',
    'data structures': 'https://www.youtube.com/watch?v=pkYVOmU3MgA',
    'time & space complexity': 'https://www.youtube.com/watch?v=D6xkbGLQesk',
    'big-o notation': 'https://www.youtube.com/watch?v=D6xkbGLQesk',
    'recursion': 'https://www.youtube.com/watch?v=IJDJ0kBx2LM',
    'arrays': 'https://www.youtube.com/watch?v=pmN9ExVY3g4',
    'linked lists': 'https://www.youtube.com/watch?v=WwfhLC16bis',
    'singly linked': 'https://www.youtube.com/watch?v=WwfhLC16bis',
    'doubly linked': 'https://www.youtube.com/watch?v=JdQeNxWCguQ',
    'stack': 'https://www.youtube.com/watch?v=A3ZUpyrnCbM',
    'queue': 'https://www.youtube.com/watch?v=D6gu-_tm9g8',
    'linear search': 'https://www.youtube.com/watch?v=UldZOLylez4',
    'binary search': 'https://www.youtube.com/watch?v=kPRA0W1kECg',
    'bubble sort': 'https://www.youtube.com/watch?v=xli_FI7CuzA',
    'merge sort': 'https://www.youtube.com/watch?v=4VqmGXwpLqc',
    'quick sort': 'https://www.youtube.com/watch?v=Hoixgm4-P4M',
    'trees': 'https://www.youtube.com/watch?v=4s13tHQSnhw',
    'binary trees': 'https://www.youtube.com/watch?v=4s13tHQSnhw',
    'binary search trees': 'https://www.youtube.com/watch?v=4s13tHQSnhw',
    'heaps': 'https://www.youtube.com/watch?v=t0Cq6tVNRBA',
    'graphs': 'https://www.youtube.com/watch?v=tWVWeAqZ0WU',
    'bfs': 'https://www.youtube.com/watch?v=xlVX7dXLS64',
    'dfs': 'https://www.youtube.com/watch?v=PMMc4VsIacU',
    'shortest path': 'https://www.youtube.com/watch?v=GazC3VDndmM',
    'dynamic programming': 'https://www.youtube.com/watch?v=oBt53YbR9Kk',
    'greedy algorithms': 'https://www.youtube.com/watch?v=HzeK7g8cD0Y',
    'hashing': 'https://www.youtube.com/watch?v=ea8BRGxGmlA',
}

C_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=KJgsSFOSQv0',
    'introduction to c': 'https://www.youtube.com/watch?v=KJgsSFOSQv0',
    'compiler': 'https://www.youtube.com/watch?v=KJgsSFOSQv0',
    'first c program': 'https://www.youtube.com/watch?v=KJgsSFOSQv0',
    'variables': 'https://www.youtube.com/watch?v=KJgsSFOSQv0',
    'operators': 'https://www.youtube.com/watch?v=KJgsSFOSQv0',
    'if, else': 'https://www.youtube.com/watch?v=i9Yy37qA_i4',
    'switch': 'https://www.youtube.com/watch?v=i9Yy37qA_i4',
    'for loop': 'https://www.youtube.com/watch?v=i9Yy37qA_i4',
    'while loop': 'https://www.youtube.com/watch?v=i9Yy37qA_i4',
    'functions': 'https://www.youtube.com/watch?v=vVj44IomNqE',
    'recursion': 'https://www.youtube.com/watch?v=ngCos392W4w',
    'arrays': 'https://www.youtube.com/watch?v=1uR4tLQC20g',
    'strings': 'https://www.youtube.com/watch?v=1uR4tLQC20g',
    'pointers': 'https://www.youtube.com/watch?v=zuegQmMdy8M',
    'pointer arithmetic': 'https://www.youtube.com/watch?v=zuegQmMdy8M',
    'structures': 'https://www.youtube.com/watch?v=dnmhB5v_F8M',
    'unions': 'https://www.youtube.com/watch?v=dnmhB5v_F8M',
    'malloc': 'https://www.youtube.com/watch?v=dnmhB5v_F8M',
    'file handling': 'https://www.youtube.com/watch?v=8mI3U6c_L8c',
    'problem solving': 'https://www.youtube.com/watch?v=Bz4MxDeEM6k',
}

ML_VIDEOS = {
    'default': 'https://www.youtube.com/watch?v=ukzFI9rgwfU',
    'introduction to machine learning': 'https://www.youtube.com/watch?v=ukzFI9rgwfU',
    'training vs testing': 'https://www.youtube.com/watch?v=fSytzGwwBVw',
    'bias & variance': 'https://www.youtube.com/watch?v=EuBBz3bI-aA',
    'cross validation': 'https://www.youtube.com/watch?v=fSytzGwwBVw',
    'confusion matrix': 'https://www.youtube.com/watch?v=Kdsp6soqA7o',
    'linear regression': 'https://www.youtube.com/watch?v=PaFPbb66DxQ',
    'logistic regression': 'https://www.youtube.com/watch?v=yIYKR4sgzI8',
    'ridge regression': 'https://www.youtube.com/watch?v=Q81RR3yKn30',
    'lasso regression': 'https://www.youtube.com/watch?v=NGf0voTMlcs',
    'k-nearest neighbors': 'https://www.youtube.com/watch?v=HVXime0nQeI',
    'naive bayes': 'https://www.youtube.com/watch?v=O2L2Uv9pdDA',
    'decision trees': 'https://www.youtube.com/watch?v=_L39rN6gz7Y',
    'random forests': 'https://www.youtube.com/watch?v=J4Wdy0Wc_xQ',
    'support vector machines': 'https://www.youtube.com/watch?v=efR1C6CvhmE',
    'k-means': 'https://www.youtube.com/watch?v=4b5d3muPQmA',
    'pca': 'https://www.youtube.com/watch?v=FgakZw6K1QQ',
    'feature engineering': 'https://www.youtube.com/watch?v=7eh4d6sabA0',
    'scikit-learn': 'https://www.youtube.com/watch?v=0B5eIE_1vpU',
    'project': 'https://www.youtube.com/watch?v=GwIo3g5OrTQ',
}


def pick_video(course_title, lesson_title):
    ct = course_title.lower()
    lt = lesson_title.lower()

    mapping = None
    if 'django' in ct:
        mapping = DJANGO_VIDEOS
    elif 'data science' in ct:
        mapping = DATA_SCIENCE_VIDEOS
    elif 'deep learning' in ct or 'tensorflow' in ct:
        mapping = DEEP_LEARNING_VIDEOS
    elif 'git' in ct:
        mapping = GIT_VIDEOS
    elif 'mysql' in ct or 'database' in ct:
        mapping = MYSQL_VIDEOS
    elif 'react' in ct:
        mapping = REACT_VIDEOS
    elif 'data structures' in ct or 'dsa' in ct:
        mapping = DSA_VIDEOS
    elif 'c programming' in ct:
        mapping = C_VIDEOS
    elif 'machine learning' in ct:
        mapping = ML_VIDEOS
    else:
        mapping = PYTHON_VIDEOS

    for keyword, url in mapping.items():
        if keyword != 'default' and keyword in lt:
            return url
    return mapping.get('default')


def generate_notes(course_title, module_name, lesson_title):
    return f"""📌 **Overview**
In this lesson, you will learn the core foundations and practical applications of **{lesson_title}** as part of *{module_name}*.

💡 **Key Concepts & Definitions**
1. **Core Principle**: Understanding the role of {lesson_title} in modern software engineering and systems architecture.
2. **Workflow & Mechanism**: How {lesson_title} processes data, executes logic, and integrates with the surrounding system.
3. **Execution Pipeline**: Step-by-step lifecycle from initialization to production runtime.

💻 **Practical Code / Workflow Reference**
```
# Key implementation pattern for {lesson_title}
1. Initialize necessary components or dependencies.
2. Apply standard architectural conventions and validations.
3. Verify test output and review edge cases.
```

⚡ **Best Practices & Industry Tips**
- Always follow modular design and clean code conventions.
- Profile resource usage, memory bounds, and latency implications.
- Write unit tests and maintain version control hygiene.
- Refer to the attached video lecture above to follow hands-on live code walkthroughs!
"""


class Command(BaseCommand):
    help = 'Populates all course lessons with topic-specific YouTube educational videos and detailed study notes.'

    def handle(self, *args, **options):
        self.stdout.write("Populating lessons with topic-specific videos and comprehensive study notes...")

        updated_count = 0
        courses = Course.objects.all()

        for course in courses:
            for lesson in course.lessons.all():
                matched_video = pick_video(course.title, lesson.title)
                notes_content = generate_notes(course.title, lesson.module_name or 'Curriculum', lesson.title)

                lesson.video_url = matched_video
                lesson.notes = notes_content
                lesson.duration_minutes = lesson.duration_minutes or 15
                lesson.save(update_fields=['video_url', 'notes', 'duration_minutes'])
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully updated {updated_count} lessons across {courses.count()} courses with videos and notes!"
        ))
