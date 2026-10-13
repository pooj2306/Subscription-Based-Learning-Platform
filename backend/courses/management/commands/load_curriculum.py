"""
Management command to remove all old courses and populate the full curriculum:
10 courses with all modules and lessons from the provided syllabus.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course, Lesson
from assessments.models import Quiz, Question, Choice
from adaptive_learning.models import Topic, AdaptiveQuestion

User = get_user_model()

CURRICULUM = [
    {
        'title': 'Full-Stack Web Development with Django',
        'stream': 'Web Development',
        'level': Course.Level.INTERMEDIATE,
        'description': 'Comprehensive guide to full-stack web development with Python and Django, from web fundamentals and ORM to REST APIs and deployment.',
        'modules': [
            {
                'name': 'Module 1 — Web Development Fundamentals',
                'lessons': [
                    'Introduction to Full-Stack Development',
                    'Client-Server Architecture',
                    'Frontend vs Backend',
                    'HTTP & HTTPS',
                    'HTML, CSS & JavaScript Basics',
                    'Web Forms',
                    'Introduction to Django',
                ],
            },
            {
                'name': 'Module 2 — Django Fundamentals',
                'lessons': [
                    'Installing Django',
                    'Creating a Django Project',
                    'Django Project Structure',
                    'Creating Django Apps',
                    'URL Routing',
                    'Views',
                    'Templates',
                    'Template Inheritance',
                ],
            },
            {
                'name': 'Module 3 — Django Models & Databases',
                'lessons': [
                    'Introduction to Django Models',
                    'Database Configuration',
                    'Django ORM',
                    'Model Fields',
                    'Migrations',
                    'CRUD Operations',
                    'QuerySets',
                    'Relationships Between Models',
                ],
            },
            {
                'name': 'Module 4 — Forms & User Input',
                'lessons': [
                    'Django Forms',
                    'Model Forms',
                    'Form Validation',
                    'Handling POST Requests',
                    'File Uploads',
                    'CSRF Protection',
                    'Error Handling',
                ],
            },
            {
                'name': 'Module 5 — Authentication & Authorization',
                'lessons': [
                    'User Authentication',
                    'Registration',
                    'Login & Logout',
                    'Password Management',
                    'Sessions',
                    'Permissions',
                    'Groups',
                    'Custom User Models',
                ],
            },
            {
                'name': 'Module 6 — APIs & Advanced Django',
                'lessons': [
                    'Introduction to REST APIs',
                    'Django REST Framework',
                    'Serializers',
                    'API Views',
                    'Authentication for APIs',
                    'Middleware',
                    'Static & Media Files',
                    'Security Best Practices',
                ],
            },
            {
                'name': 'Module 7 — Full-Stack Django Project',
                'lessons': [
                    'Building a Django Web Application',
                    'Connecting Frontend & Backend',
                    'Database Integration',
                    'User Authentication',
                    'CRUD Functionality',
                    'API Integration',
                    'Testing',
                    'Deployment',
                ],
            },
        ],
    },
    {
        'title': 'Data Science with Python',
        'stream': 'Data Science',
        'level': Course.Level.INTERMEDIATE,
        'description': 'Learn data science end-to-end with Python: NumPy arrays, Pandas data manipulation, preprocessing, EDA, visualization, and projects.',
        'modules': [
            {
                'name': 'Module 1 — Introduction to Data Science',
                'lessons': [
                    'Introduction to Data Science',
                    'Data Science Workflow',
                    'Types of Data',
                    'Structured & Unstructured Data',
                    'Data Collection',
                    'Data Sources',
                    'Data Science Tools',
                    'Python for Data Science',
                ],
            },
            {
                'name': 'Module 2 — NumPy for Data Science',
                'lessons': [
                    'Introduction to NumPy',
                    'NumPy Arrays',
                    'Array Creation',
                    'Array Indexing & Slicing',
                    'Array Operations',
                    'Mathematical Operations',
                    'Broadcasting',
                    'Statistical Functions',
                ],
            },
            {
                'name': 'Module 3 — Pandas & Data Manipulation',
                'lessons': [
                    'Introduction to Pandas',
                    'Series',
                    'DataFrames',
                    'Reading CSV Files',
                    'Reading JSON Files',
                    'Selecting & Filtering Data',
                    'Sorting Data',
                    'Grouping Data',
                    'Merging & Joining Data',
                ],
            },
            {
                'name': 'Module 4 — Data Cleaning & Preprocessing',
                'lessons': [
                    'Missing Values',
                    'Handling Duplicates',
                    'Data Type Conversion',
                    'Data Transformation',
                    'Outlier Detection',
                    'Data Encoding',
                    'Data Scaling',
                    'Data Preprocessing',
                ],
            },
            {
                'name': 'Module 5 — Exploratory Data Analysis',
                'lessons': [
                    'Introduction to EDA',
                    'Descriptive Statistics',
                    'Mean, Median & Mode',
                    'Variance & Standard Deviation',
                    'Correlation',
                    'Distribution Analysis',
                    'Identifying Patterns',
                    'Identifying Outliers',
                ],
            },
            {
                'name': 'Module 6 — Data Visualization',
                'lessons': [
                    'Introduction to Data Visualization',
                    'Matplotlib',
                    'Seaborn',
                    'Line Charts',
                    'Bar Charts',
                    'Histograms',
                    'Scatter Plots',
                    'Box Plots',
                    'Heatmaps',
                ],
            },
            {
                'name': 'Module 7 — Practical Data Science Projects',
                'lessons': [
                    'Data Analysis Project',
                    'Data Cleaning Project',
                    'Exploratory Data Analysis Project',
                    'Data Visualization Project',
                    'Feature Engineering',
                    'Statistical Analysis',
                    'Final Data Science Project',
                ],
            },
        ],
    },
    {
        'title': 'Deep Learning with TensorFlow',
        'stream': 'Artificial Intelligence',
        'level': Course.Level.ADVANCED,
        'description': 'Master deep learning architecture from artificial neural networks to CNNs, sequential RNN/LSTM models, and TensorFlow model deployment.',
        'modules': [
            {
                'name': 'Module 1 — Introduction to Deep Learning',
                'lessons': [
                    'Introduction to Artificial Neural Networks',
                    'Machine Learning vs Deep Learning',
                    'Neural Network Architecture',
                    'Neurons',
                    'Weights & Bias',
                    'Forward Propagation',
                    'Loss Functions',
                    'Backpropagation',
                ],
            },
            {
                'name': 'Module 2 — TensorFlow & Keras',
                'lessons': [
                    'Introduction to TensorFlow',
                    'Installing TensorFlow',
                    'Tensors',
                    'Tensor Operations',
                    'Introduction to Keras',
                    'Sequential Models',
                    'Layers',
                    'Building a Neural Network',
                ],
            },
            {
                'name': 'Module 3 — Neural Network Training',
                'lessons': [
                    'Model Compilation',
                    'Loss Functions',
                    'Optimizers',
                    'Learning Rate',
                    'Batch Size',
                    'Epochs',
                    'Training & Validation',
                    'Model Evaluation',
                ],
            },
            {
                'name': 'Module 4 — Activation & Optimization',
                'lessons': [
                    'Activation Functions',
                    'ReLU',
                    'Sigmoid',
                    'Tanh',
                    'Softmax',
                    'Gradient Descent',
                    'Stochastic Gradient Descent',
                    'Adam Optimizer',
                ],
            },
            {
                'name': 'Module 5 — Convolutional Neural Networks',
                'lessons': [
                    'Introduction to CNN',
                    'Convolution Operation',
                    'Filters & Kernels',
                    'Feature Maps',
                    'Pooling',
                    'Max Pooling',
                    'CNN Architecture',
                    'Image Classification',
                ],
            },
            {
                'name': 'Module 6 — Sequential Models & Advanced Deep Learning',
                'lessons': [
                    'Introduction to RNN',
                    'Sequence Data',
                    'LSTM',
                    'GRU',
                    'Dropout',
                    'Batch Normalization',
                    'Regularization',
                    'Transfer Learning',
                ],
            },
            {
                'name': 'Module 7 — Deep Learning Projects',
                'lessons': [
                    'Image Classification Project',
                    'Neural Network Project',
                    'CNN Project',
                    'Model Evaluation',
                    'Saving & Loading Models',
                    'Model Prediction',
                    'TensorFlow Model Deployment',
                    'Final Deep Learning Project',
                ],
            },
        ],
    },
    {
        'title': 'Git & GitHub for Developers',
        'stream': 'DevOps & Tools',
        'level': Course.Level.BEGINNER,
        'description': 'Essential version control guide covering Git commands, branching, merge conflicts, pull requests, and GitHub CI/CD automation.',
        'modules': [
            {
                'name': 'Module 1 — Introduction to Git',
                'lessons': [
                    'Introduction to Version Control',
                    'Git vs GitHub',
                    'Installing Git',
                    'Git Configuration',
                    'Git Terminology',
                    'Git Repository',
                    'Working Directory',
                    'Staging Area',
                ],
            },
            {
                'name': 'Module 2 — Basic Git Commands',
                'lessons': [
                    'git init',
                    'git status',
                    'git add',
                    'git commit',
                    'git log',
                    'git diff',
                    'git show',
                    'Git Commit Messages',
                ],
            },
            {
                'name': 'Module 3 — GitHub Fundamentals',
                'lessons': [
                    'Introduction to GitHub',
                    'Creating a GitHub Account',
                    'Creating a Repository',
                    'Connecting Local Repository',
                    'git push',
                    'git pull',
                    'git clone',
                    'Remote Repositories',
                ],
            },
            {
                'name': 'Module 4 — Branching & Merging',
                'lessons': [
                    'Introduction to Branches',
                    'Creating Branches',
                    'Switching Branches',
                    'Deleting Branches',
                    'Merging Branches',
                    'Merge Conflicts',
                    'Resolving Conflicts',
                    'Branch Management',
                ],
            },
            {
                'name': 'Module 5 — Collaboration with GitHub',
                'lessons': [
                    'GitHub Collaboration',
                    'Forking',
                    'Pull Requests',
                    'Code Reviews',
                    'Issues',
                    'Discussions',
                    'Repository Permissions',
                    'Team Collaboration',
                ],
            },
            {
                'name': 'Module 6 — Advanced Git',
                'lessons': [
                    'Git Rebase',
                    'Git Stash',
                    'Git Reset',
                    'Git Revert',
                    'Git Tags',
                    'Git Cherry-Pick',
                    'Git Ignore',
                    'Git Workflows',
                ],
            },
            {
                'name': 'Module 7 — GitHub Projects & Best Practices',
                'lessons': [
                    'GitHub Project Management',
                    'README Files',
                    'Repository Documentation',
                    'GitHub Actions',
                    'Continuous Integration',
                    'Release Management',
                    'Git Best Practices',
                    'Final Git/GitHub Project',
                ],
            },
        ],
    },
    {
        'title': 'Database Management with MySQL',
        'stream': 'Databases',
        'level': Course.Level.INTERMEDIATE,
        'description': 'Master relational database architecture, SQL queries, table joins, normalization, stored procedures, transactions, and project design.',
        'modules': [
            {
                'name': 'Module 1 — Database Fundamentals',
                'lessons': [
                    'Introduction to Databases',
                    'DBMS vs RDBMS',
                    'Introduction to MySQL',
                    'Database Architecture',
                    'Tables, Rows & Columns',
                    'Primary Keys',
                    'Foreign Keys',
                    'Database Design',
                ],
            },
            {
                'name': 'Module 2 — SQL Fundamentals',
                'lessons': [
                    'Introduction to SQL',
                    'CREATE',
                    'ALTER',
                    'DROP',
                    'TRUNCATE',
                    'INSERT',
                    'UPDATE',
                    'DELETE',
                    'SELECT',
                ],
            },
            {
                'name': 'Module 3 — Data Retrieval & Filtering',
                'lessons': [
                    'WHERE Clause',
                    'ORDER BY',
                    'GROUP BY',
                    'HAVING',
                    'DISTINCT',
                    'LIMIT',
                    'Aggregate Functions',
                    'SQL Operators',
                ],
            },
            {
                'name': 'Module 4 — Relationships & Joins',
                'lessons': [
                    'One-to-One Relationships',
                    'One-to-Many Relationships',
                    'Many-to-Many Relationships',
                    'INNER JOIN',
                    'LEFT JOIN',
                    'RIGHT JOIN',
                    'FULL OUTER JOIN',
                    'Self Join',
                ],
            },
            {
                'name': 'Module 5 — Database Design & Normalization',
                'lessons': [
                    'Database Design',
                    'ER Diagrams',
                    'Functional Dependencies',
                    'Data Redundancy',
                    'Normalization',
                    'First Normal Form',
                    'Second Normal Form',
                    'Third Normal Form',
                ],
            },
            {
                'name': 'Module 6 — Advanced MySQL',
                'lessons': [
                    'Subqueries',
                    'Views',
                    'Indexes',
                    'Stored Procedures',
                    'Functions',
                    'Triggers',
                    'Transactions',
                    'ACID Properties',
                ],
            },
            {
                'name': 'Module 7 — Practical MySQL Project',
                'lessons': [
                    'Database Design Project',
                    'Creating Database Schema',
                    'Creating Tables',
                    'Relationships',
                    'CRUD Operations',
                    'Complex SQL Queries',
                    'Database Optimization',
                    'Connecting MySQL with Applications',
                    'Final Database Project',
                ],
            },
        ],
    },
    {
        'title': 'Python Programming: From Beginner to Advanced',
        'stream': 'Programming Languages',
        'level': Course.Level.BEGINNER,
        'description': 'Complete Python programming journey from basic syntax and data structures to object-oriented programming, decorators, and real-world projects.',
        'modules': [
            {
                'name': 'Module 1 — Python Basics',
                'lessons': [
                    'Installing Python & Setup',
                    'Strings',
                    'Integers & Floats',
                    'Lists, Tuples & Sets',
                    'Dictionaries',
                    'Conditionals & Booleans',
                    'Loops & Iterations',
                    'Functions',
                    'Import Modules',
                ],
            },
            {
                'name': 'Module 2 — Python Environment & Tools',
                'lessons': [
                    'pip',
                    'Virtual Environments',
                    'Jupyter Notebook',
                    'VS Code / Python Development Environment',
                ],
            },
            {
                'name': 'Module 3 — Intermediate Python',
                'lessons': [
                    'Variable Scope',
                    'Slicing',
                    'Comprehensions',
                    'Sorting',
                    '*args and **kwargs',
                    'zip()',
                    'enumerate()',
                    'lambda',
                    'map(), filter(), reduce()',
                ],
            },
            {
                'name': 'Module 4 — Files & Exceptions',
                'lessons': [
                    'File Handling',
                    'CSV',
                    'JSON',
                    'Exception Handling',
                    'Logging',
                ],
            },
            {
                'name': 'Module 5 — Object-Oriented Programming',
                'lessons': [
                    'Classes',
                    'Objects',
                    'Instance Variables',
                    'Class Variables',
                    'Methods',
                    'Inheritance',
                    'Special Methods',
                ],
            },
            {
                'name': 'Module 6 — Advanced Python',
                'lessons': [
                    'Decorators',
                    'Generators',
                    'Iterators',
                    'Context Managers',
                    'Regular Expressions',
                    'Unit Testing',
                    'Advanced Python Techniques',
                ],
            },
            {
                'name': 'Module 7 — Projects',
                'lessons': [
                    'Building a Python Project',
                    'Working with APIs',
                    'Database Connectivity',
                    'Final Python Project',
                ],
            },
        ],
    },
    {
        'title': 'React.js: Building Modern Web Applications',
        'stream': 'Web Development',
        'level': Course.Level.INTERMEDIATE,
        'description': 'Build responsive, fast web apps using React fundamentals, hooks, controlled forms, React Router, API consumption, and advanced optimization.',
        'modules': [
            {
                'name': 'Module 1 — React Fundamentals',
                'lessons': [
                    'Introduction to React',
                    'Setting Up a React Project',
                    'Components',
                    'JSX',
                    'Props',
                    'State',
                    'Event Handling',
                    'Conditional Rendering',
                    'Lists & Keys',
                ],
            },
            {
                'name': 'Module 2 — React Hooks',
                'lessons': [
                    'useState',
                    'useEffect',
                    'useContext',
                    'useReducer',
                    'useRef',
                    'Custom Hooks',
                ],
            },
            {
                'name': 'Module 3 — Forms & Components',
                'lessons': [
                    'Form Handling',
                    'Controlled Components',
                    'Component Communication',
                    'Reusable Components',
                    'Styling React Applications',
                ],
            },
            {
                'name': 'Module 4 — React Router',
                'lessons': [
                    'React Router',
                    'Routes',
                    'Route Parameters',
                    'Nested Routes',
                    'Navigation',
                ],
            },
            {
                'name': 'Module 5 — API & Data',
                'lessons': [
                    'Fetching API Data',
                    'Axios',
                    'Loading & Error States',
                    'CRUD Operations',
                    'Working with REST APIs',
                ],
            },
            {
                'name': 'Module 6 — Advanced React',
                'lessons': [
                    'Context API',
                    'Performance Optimization',
                    'React.memo',
                    'useMemo',
                    'useCallback',
                    'Code Splitting',
                    'Lazy Loading',
                ],
            },
            {
                'name': 'Module 7 — Project',
                'lessons': [
                    'Building a React Application',
                    'Connecting Frontend to an API',
                    'Final Project',
                ],
            },
        ],
    },
    {
        'title': 'Data Structures and Algorithms in Python',
        'stream': 'Computer Science',
        'level': Course.Level.INTERMEDIATE,
        'description': 'Comprehensive algorithms and data structures curriculum: complexity analysis, linked lists, stacks, queues, trees, graphs, sorting, and DP.',
        'modules': [
            {
                'name': 'Module 1 — DSA Fundamentals',
                'lessons': [
                    'Introduction to Data Structures',
                    'Time & Space Complexity',
                    'Big-O Notation',
                    'Recursion',
                ],
            },
            {
                'name': 'Module 2 — Arrays & Linked Lists',
                'lessons': [
                    'Arrays',
                    'Array Operations',
                    'Linked Lists',
                    'Singly Linked Lists',
                    'Doubly Linked Lists',
                    'Circular Linked Lists',
                ],
            },
            {
                'name': 'Module 3 — Stacks & Queues',
                'lessons': [
                    'Stack',
                    'Stack Applications',
                    'Queue',
                    'Circular Queue',
                    'Priority Queue',
                ],
            },
            {
                'name': 'Module 4 — Searching & Sorting',
                'lessons': [
                    'Linear Search',
                    'Binary Search',
                    'Bubble Sort',
                    'Selection Sort',
                    'Insertion Sort',
                    'Merge Sort',
                    'Quick Sort',
                ],
            },
            {
                'name': 'Module 5 — Trees',
                'lessons': [
                    'Binary Trees',
                    'Binary Search Trees',
                    'Tree Traversals',
                    'AVL Trees',
                    'Heaps',
                ],
            },
            {
                'name': 'Module 6 — Graphs',
                'lessons': [
                    'Graph Representation',
                    'BFS',
                    'DFS',
                    'Shortest Path',
                    'Minimum Spanning Tree',
                ],
            },
            {
                'name': 'Module 7 — Advanced DSA',
                'lessons': [
                    'Hashing',
                    'Greedy Algorithms',
                    'Dynamic Programming',
                    'Backtracking',
                ],
            },
        ],
    },
    {
        'title': 'C Programming: Fundamentals to Problem Solving',
        'stream': 'Programming Languages',
        'level': Course.Level.BEGINNER,
        'description': 'Foundational procedural programming in C covering compiler setup, control flow, functions, memory pointers, structures, and problem solving.',
        'modules': [
            {
                'name': 'Module 1 — C Basics',
                'lessons': [
                    'Introduction to C',
                    'Installing a C Compiler',
                    'First C Program',
                    'Variables & Constants',
                    'Data Types',
                    'Input & Output',
                    'Operators',
                ],
            },
            {
                'name': 'Module 2 — Control Flow',
                'lessons': [
                    'if, else, else if',
                    'Switch Statements',
                    'for Loop',
                    'while Loop',
                    'do-while Loop',
                    'break & continue',
                ],
            },
            {
                'name': 'Module 3 — Functions',
                'lessons': [
                    'Functions',
                    'Function Arguments',
                    'Return Values',
                    'Recursion',
                    'Storage Classes',
                ],
            },
            {
                'name': 'Module 4 — Arrays & Strings',
                'lessons': [
                    'One-Dimensional Arrays',
                    'Multi-Dimensional Arrays',
                    'Strings',
                    'String Functions',
                ],
            },
            {
                'name': 'Module 5 — Pointers',
                'lessons': [
                    'Introduction to Pointers',
                    'Pointer Arithmetic',
                    'Pointers & Arrays',
                    'Pointers & Functions',
                    'Double Pointers',
                ],
            },
            {
                'name': 'Module 6 — Structures & Memory',
                'lessons': [
                    'Structures',
                    'Unions',
                    'Dynamic Memory Allocation',
                    'malloc, calloc, realloc, free',
                ],
            },
            {
                'name': 'Module 7 — File Handling',
                'lessons': [
                    'Files in C',
                    'Reading Files',
                    'Writing Files',
                    'File Operations',
                ],
            },
            {
                'name': 'Module 8 — Problem Solving',
                'lessons': [
                    'Basic C Programs',
                    'Pattern Problems',
                    'Array Problems',
                    'String Problems',
                    'Mini Project',
                ],
            },
        ],
    },
    {
        'title': 'Machine Learning Fundamentals',
        'stream': 'Artificial Intelligence',
        'level': Course.Level.INTERMEDIATE,
        'description': 'Practical ML fundamentals covering supervised regression and classification, unsupervised clustering, PCA, model evaluation, and scikit-learn.',
        'modules': [
            {
                'name': 'Module 1 — Introduction',
                'lessons': [
                    'A Gentle Introduction to Machine Learning',
                    'Training vs Testing',
                    'Bias & Variance',
                    'Cross Validation',
                    'Confusion Matrix',
                    'Precision & Recall',
                    'ROC & AUC',
                ],
            },
            {
                'name': 'Module 2 — Regression',
                'lessons': [
                    'Linear Regression',
                    'Multiple Linear Regression',
                    'Logistic Regression',
                    'Ridge Regression',
                    'Lasso Regression',
                    'Gradient Descent',
                ],
            },
            {
                'name': 'Module 3 — Classification',
                'lessons': [
                    'K-Nearest Neighbors',
                    'Naive Bayes',
                    'Decision Trees',
                    'Random Forests',
                    'Support Vector Machines',
                ],
            },
            {
                'name': 'Module 4 — Unsupervised Learning',
                'lessons': [
                    'K-Means Clustering',
                    'Hierarchical Clustering',
                    'PCA',
                    'Dimensionality Reduction',
                ],
            },
            {
                'name': 'Module 5 — Model Evaluation',
                'lessons': [
                    'Training & Testing Data',
                    'Cross Validation',
                    'Overfitting & Underfitting',
                    'Hyperparameter Tuning',
                    'Model Performance Metrics',
                ],
            },
            {
                'name': 'Module 6 — Practical Machine Learning',
                'lessons': [
                    'Feature Engineering',
                    'Preparing Data',
                    'Building ML Models',
                    'Evaluating Models',
                    'Saving & Loading Models',
                ],
            },
            {
                'name': 'Module 7 — Python Implementation',
                'lessons': [
                    'NumPy for ML',
                    'Pandas for ML',
                    'Matplotlib / Visualization',
                    'Scikit-learn',
                    'Building a Regression Project',
                    'Building a Classification Project',
                    'Building a Clustering Project',
                    'Final ML Project',
                ],
            },
        ],
    },
]


class Command(BaseCommand):
    help = 'Removes existing courses and populates the 10 requested curriculum courses with all modules and lessons.'

    def handle(self, *args, **options):
        self.stdout.write("Removing existing courses and setting up new curriculum...")

        instructor = User.objects.filter(role__in=['INSTRUCTOR', 'ADMIN']).first()
        if not instructor:
            instructor = User.objects.create_user(
                username='instructor',
                email='instructor@sblp.com',
                password='password123',
                role='INSTRUCTOR',
            )

        # 1. Remove all old courses
        deleted_count, _ = Course.objects.all().delete()
        self.stdout.write(f"Removed previous courses ({deleted_count} items deleted).")

        total_courses = 0
        total_lessons = 0

        # 2. Create the 10 curriculum courses
        for c_data in CURRICULUM:
            course = Course.objects.create(
                title=c_data['title'],
                stream=c_data['stream'],
                level=c_data['level'],
                description=c_data['description'],
                instructor=instructor,
                is_published=True,
                requires_subscription=True,
            )
            total_courses += 1

            lesson_order = 1
            for m_data in c_data['modules']:
                mod_name = m_data['name']
                # Create a Topic for this module for adaptive learning
                clean_topic_name = mod_name.split('—')[-1].strip() if '—' in mod_name else mod_name
                Topic.objects.get_or_create(
                    name=f"{course.title[:20]}: {clean_topic_name}",
                    course=course,
                )

                for l_title in m_data['lessons']:
                    Lesson.objects.create(
                        course=course,
                        module_name=mod_name,
                        title=l_title,
                        order=lesson_order,
                        duration_minutes=15,
                    )
                    lesson_order += 1
                    total_lessons += 1

            # Create a sample Adaptive Quiz for the course
            quiz = Quiz.objects.create(
                course=course,
                title=f"{c_data['title']} Mastery Quiz",
                description=f"Adaptive assessment covering all modules of {c_data['title']}.",
                pass_percentage=60.0,
                created_by=instructor,
                is_active=True,
            )

            # Seed 3 questions (Easy, Medium, Hard) for the quiz
            q_easy = Question.objects.create(
                quiz=quiz,
                text=f"Which fundamental concept is central to {c_data['title']}?",
                marks=1,
                order=1,
            )
            Choice.objects.create(question=q_easy, text=f"Core principles of {c_data['stream']}", is_correct=True)
            Choice.objects.create(question=q_easy, text="Arbitrary random values", is_correct=False)
            Choice.objects.create(question=q_easy, text="Unstructured execution without design", is_correct=False)

            t_first = course.topics.first()
            AdaptiveQuestion.objects.create(question=q_easy, difficulty=1, topic=t_first)

            q_med = Question.objects.create(
                quiz=quiz,
                text=f"What is the recommended best practice when implementing {c_data['title']} projects?",
                marks=2,
                order=2,
            )
            Choice.objects.create(question=q_med, text="Modular architecture with robust testing and error handling", is_correct=True)
            Choice.objects.create(question=q_med, text="Writing all logic in a single monolithic script", is_correct=False)
            Choice.objects.create(question=q_med, text="Ignoring version control and documentation", is_correct=False)
            AdaptiveQuestion.objects.create(question=q_med, difficulty=2, topic=t_first)

            q_hard = Question.objects.create(
                quiz=quiz,
                text=f"When scaling {c_data['title']} solutions in production, which architectural consideration is most critical?",
                marks=3,
                order=3,
            )
            Choice.objects.create(question=q_hard, text="Performance profiling, caching, and optimized data structures", is_correct=True)
            Choice.objects.create(question=q_hard, text="Hardcoding credentials and bypassing validation", is_correct=False)
            Choice.objects.create(question=q_hard, text="Maximizing global shared mutable state", is_correct=False)
            AdaptiveQuestion.objects.create(question=q_hard, difficulty=3, topic=t_first)

        self.stdout.write(self.style.SUCCESS(
            f"Successfully populated {total_courses} courses with {total_lessons} total lessons across all modules!"
        ))
