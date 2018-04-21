{
  'targets': [
    {
      'target_name': 'key',
      'sources': ['key.cc'],
      'include_dirs': ['<!(node -e "require(\'nan\')")']
    }
  ]
}
