import BaseImageTool from '@editorjs/image';

import { icons } from '../../icons';

export default class ImageTool extends BaseImageTool {
  public static override get toolbox() {
    return {
      title: 'Image',
      icon: icons.image,
    };
  }
}
