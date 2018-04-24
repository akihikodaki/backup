# Copyright (C) 2018  Akihiko Odaki <nekomanma@pixiv.co.jp>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, version 3 of the License.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

{
  'targets': [
    {
      'target_name': 'key',
      'sources': ['key.cc'],
      'include_dirs': ['<!(node -e "require(\'nan\')")']
    },

    # Copy the binary from the build directory beforehand Sapper blows it up.
    {
      'target_name': 'copy',
      'type': 'none',
      'dependencies': ['key'],
      'copies': [
        {
          'destination': '<(module_root_dir)',
          'files': ['<(module_root_dir)/build/Release/key.node']
        }
      ]
    }
  ]
}