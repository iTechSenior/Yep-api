import { AbstractIndexCreationTask } from 'ravendb';

class Playlists extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from playlist in docs.Playlists
    select new
    {
        Query = new
        {
          playlist.title,
          playlist.trainer
        },
        playlist.trainer
    }`;
  }
}

export { Playlists };
