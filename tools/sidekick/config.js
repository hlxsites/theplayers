/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// This file contains the project-specific configuration for the sidekick.
(() => {
  window.hlx.initSidekick({
    project: 'PGA The Players',
    host: 'www.theplayers.com',
    hlx3: true,
    plugins: [
      // TOOLS ---------------------------------------------------------------------
      {
        id: 'tools',
        condition: (sk) => !sk.isEditor(),
        button: {
          text: 'Tools',
          isDropdown: true,
        },
      },
      // COURSE BUILDER ------------------------------------------------------------
      {
        id: 'course',
        condition: (sk) => !sk.isEditor(),
        button: {
          text: 'Course Builder',
          action: (_, sk) => {
            const { config } = sk;
            window.open(`https://${config.innerHost}/tools/tagger/index.html`, 'hlx-course-builder');
          },
        },
      },
    ],
  });
})();
