from setuptools import setup

setup(name='pass-emploi-api',
      version='0.0.1',
      description='Pass Emploi API',
      url='https://github.com/SocialGouv/pass-emploi-api',
      install_requires=[
          'flask',
          'pytest',
          'firebase_admin'
      ],
      zip_safe=False)
