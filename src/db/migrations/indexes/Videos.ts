import { AbstractIndexCreationTask } from 'ravendb';

class Videos extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from videos in docs.Videos
    select new
    {
        Query = new
        {
          userId = videos.user.id,
          videoTitle = videos.videoTitle,
          videoUrl = videos.videoUrl,
          category = videos.category,
          subCategory = videos.subCategory,
          language = videos.language,
          createdAt = videos.createdAt,
          updatedAt = videos.updatedAt,
          brand = videos.brand,
          playlist = videos.playlist,
          displayOrder = videos.displayOrder,
        },
        userId = videos.user.id,
        videoTitle = videos.videoTitle,
        videoUrl = videos.videoUrl,
        category = videos.category,
        subCategory = videos.subCategory,
        language = videos.language,
        description = videos.description,
        createdAt = videos.createdAt,
        updatedAt = videos.updatedAt,
        brand = videos.brand,
        playlist = videos.playlist,
        displayOrder = videos.displayOrder,

    }`;
  }
}

export { Videos };
