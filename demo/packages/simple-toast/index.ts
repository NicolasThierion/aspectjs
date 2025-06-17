// Import stylesheets
import { Toasted } from './annotations/toasted.annotation';
import { Validated } from './annotations/validated.annotation';
import './aop';
import { Comment } from './comment.model';
import './style.css';

class Controller {
  createComment(form: HTMLFormElement) {
    return new Comment(Object.fromEntries(new FormData(form)));
  }

  @Toasted() // convert log.info, log.error into toasts
  submitComment(@Validated() comment: Comment) {
    // comment has been validated. Send it over the network
    console.info('comment sucessfully published');
    return false;
  }
}

(window as any).controller = new Controller();
