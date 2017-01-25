import { Component, ViewChild } from '@angular/core';
import { Platform, NavParams, Content, Events,
  NavController, ViewController, LoadingController, ToastController, AlertController, ModalController, ActionSheetController } from 'ionic-angular';
import { GoogleMap, GoogleMapsEvent, GoogleMapsLatLng, GoogleMapsLatLngBounds, CameraPosition, GoogleMapsMarkerOptions, GoogleMapsMarker } from 'ionic-native';

import { BasePage } from '../../pages/base-page/base-page';
import { ResponseAddPage } from '../response-add/response-add';
import { ResponseDetailsPage } from '../response-details/response-details';
import { ResponseSearchPage } from '../response-search/response-search';

import { CardComponent } from '../../components/card/card';

import { ApiService } from '../../providers/api-service';
import { LoggerService } from '../../providers/logger-service';
import { DatabaseService } from '../../providers/database-service';

import { Deployment } from '../../models/deployment';
import { Post } from '../../models/post';
import { Form } from '../../models/form';
import { Image } from '../../models/image';
import { Value } from '../../models/value';
import { Attribute } from '../../models/attribute';
import { Filter } from '../../models/filter';

@Component({
  selector: 'page-response-list',
  templateUrl: 'response-list.html',
  providers: [ ApiService, DatabaseService, LoggerService ],
  entryComponents:[ ResponseAddPage, ResponseDetailsPage, ResponseSearchPage ]
})
export class ResponseListPage extends BasePage {

  deployment: Deployment = null;
  posts: Post[] = null;
  filtered: Post[] = null;
  forms: Form[] = null;
  filter: Filter = null;
  map: GoogleMap = null;
  view: string = 'list';

  @ViewChild(Content)
  content: Content;

  constructor(
    public platform:Platform,
    public api:ApiService,
    public logger:LoggerService,
    public database:DatabaseService,
    public events:Events,
    public navParams:NavParams,
    public navController:NavController,
    public viewController:ViewController,
    public modalController:ModalController,
    public toastController:ToastController,
    public alertController:AlertController,
    public loadingController:LoadingController,
    public actionController:ActionSheetController) {
      super(navController, viewController, modalController, toastController, alertController, loadingController, actionController);
  }

  ionViewDidLoad() {
    this.logger.info(this, 'ionViewDidLoad');
    this.events.subscribe('post:deleted', (post_id:number) => {
      this.logger.info(this, 'Events', 'post:deleted', post_id);
      this.posts = null;
      this.filtered = null;
    });
    this.events.subscribe('post:updated', (post_id:number) => {
      this.logger.info(this, 'Events', 'post:deleted', post_id);
      this.posts = null;
      this.filtered = null;
    });
  }

  ionViewWillEnter() {
    this.logger.info(this, "ionViewWillEnter");
    this.deployment = this.navParams.get("deployment");
    this.forms = this.navParams.get("forms");
    this.loadUpdates(null, true);
  }

  ionViewDidEnter() {
    this.logger.info(this, "ionViewDidEnter");
  }

  loadUpdates(event:any=null, cache:boolean=false) {
    this.logger.info(this, "loadUpdates", "Cache", cache);
    let promises = [
      this.loadFilters(cache),
      this.loadPosts(cache)];
    Promise.all(promises).then(
      (done) => {
        if (event != null) {
          event.complete();
        }
        this.logger.info(this, "loadUpdates", "Done");
      },
      (error) => {
        if (event != null) {
          event.complete();
        }
        this.logger.error(this, "loadUpdates", error);
      });
  }

  loadFilters(cache:boolean=true) {
    if (cache && this.filter) {
      this.logger.info(this, "loadFilters", "Cached", this.filter);
      this.resizeContent();
    }
    else {
      this.database.getFilter(this.deployment).then(
        (results) => {
          this.filter = <Filter>results;
          this.logger.info(this, "loadFilters", "Database", this.filter);
          this.resizeContent();
        },
        (error) => {
          this.logger.error(this, "loadFilters", "Database", error);
        });
    }
  }

  loadPosts(cache:boolean=true) {
    this.logger.info(this, "loadPosts", "Cache", cache);
    if (cache && this.posts != null && this.posts.length > 0) {
      this.logger.info(this, "loadPosts", "Cached", this.posts.length);
    }
    else if (cache) {
      return this.database.getPostsWithValues(this.deployment).then(
        (results) => {
          let posts = <Post[]>results;
          this.logger.info(this, "loadPosts", "Database", posts.length);
          if (posts && posts.length > 0) {
            this.posts = posts;
            this.filtered = this.getFiltered(this.posts, this.filter);
          }
          else {
            this.loadPosts(false);
          }
        },
        (error) => {
          this.logger.error(this, "loadPosts", "Database", error);
        });
    }
    else {
      return this.api.getPostsWithValues(this.deployment).then(
        (results) => {
          this.posts = <Post[]>results;
          this.filtered = this.getFiltered(this.posts, this.filter);
          this.logger.info(this, "loadPosts", "API", this.posts.length);
          for (let index in this.posts) {
            let post:Post = this.posts[index];
            this.database.savePost(this.deployment, post).then(saved => {
              this.logger.info(this, "loadPosts", "API", "Post Saved", post.id);
            });
            for (let index in post.values) {
              let value:Value = post.values[index];
              this.database.saveValue(this.deployment, value).then(saved => {
                this.logger.info(this, "loadPosts", "API", "Value Saved", value.key);
              });
            }
          }
        },
        (error) => {
          this.logger.error(this, "loadPosts", "API", error);
        });
    }
  }

  getFiltered(posts:Post[], filter:Filter): Post[] {
    let filtered: Post[] = [];
    for (let index in posts) {
      let post:Post = posts[index];
      if (filter == null) {
        filtered.push(post);
      }
      else if (filter.showPost(post)) {
        filtered.push(post);
      }
    }
    return filtered;
  }

  showResponse(post:Post) {
    this.logger.info(this, "showResponse", post);
    this.showPage(ResponseDetailsPage,
      { deployment: this.deployment,
        post: post });
  }

  addResponse(event:any) {
    this.logger.info(this, "addResponse");
    let buttons = [];
    if (this.forms != null) {
      for (var i = 0; i < this.forms.length; i++){
        let form = this.forms[i];
        buttons.push({
          text: form.name,
          handler: () => {
            this.logger.info(this, "addResponse", "Form", form);
            this.showResponseAdd(form);
        }});
      }
    }
    buttons.push({
      text: 'Cancel',
      role: 'cancel'});
    this.showActionSheet('Submit a survey response', buttons);
  }

  showResponseAdd(form) {
    let modal = this.showModal(ResponseAddPage,
      { form: form,
        deployment: this.deployment })
    modal.onDidDismiss(data => {
      this.logger.info(this, "showResponseAdd", "Modal", data);
    });
  }

  searchResponses(event:any) {
    this.logger.info(this, "searchResponses");
    let modal = this.showModal(ResponseSearchPage,
      { deployment: this.deployment,
        filter: this.filter,
        forms: this.forms });
    modal.onDidDismiss(data => {
      this.logger.info(this, "searchResponses", "Modal", data);
      if (data) {
        this.filter = data['filter'];
        this.filtered = this.getFiltered(this.posts, this.filter);
      }
      this.resizeContent();
    });
  }

  shareResponses(event:any) {
    let subject = this.deployment.name;
    let message = this.deployment.description
    let file = this.deployment.image;
    let url = this.deployment.url;
    this.logger.info(this, "shareResponses", "Subject", subject, "Message", message, "File", file, "URL", url);
    this.showShare(subject, message, file, url).then(
      (shared) => {
        if (shared) {
          this.showToast("Responses Shared");
        }
      },
      (error) => {
        this.showToast(error);
    });
  }

  showOptions(post:Post) {
    this.logger.info(this, "showOptions");
    let buttons = [];
    if (post.can_read) {
      buttons.push({
        text: 'Share',
        handler:() => this.shareResponse(post)
      });
    }
    if (post.can_update) {
      buttons.push({
         text: 'Edit',
         handler:() => this.editResponse(post)
       });
      // buttons.push({
      //   text: 'Add to Collection',
      //   handler:() => this.addToCollection(post)
      // });
      if (post.status == 'published' || post.status == 'draft') {
       buttons.push({
         text: 'Archive',
         handler:() => this.archiveResponse(post)
       });
      }
      if (post.status == 'archived' || post.status == 'draft') {
        buttons.push({
          text: 'Publish',
          handler:() => this.publishResponse(post)
        });
      }
    }
    if (post.can_delete) {
      buttons.push({
        text: 'Delete',
        role: 'destructive',
        handler:() => this.deleteResponse(post)
      });
    }
    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });
   this.showActionSheet(null, buttons);
  }

  shareResponse(post:Post) {
    let subject:string = `${this.deployment.name} | ${post.title}`;
    let message:string = post.description
    let file:string = post.image_url;
    let url:string = post.url;
    this.logger.info(this, "shareResponse", "Subject", subject, "Message", message, "File", file, "URL", url);
    this.showShare(subject, message, file, url).then(
      (shared) => {
        if (shared) {
          this.showToast("Response Shared");
        }
      },
      (error) => {
        this.showToast(error);
    });
  }

  editResponse(post:Post) {
    this.logger.info(this, "editResponse");
    this.showToast('Edit Not Implemented');
    // let modal = this.showModal(ResponseEditPage,
    //   { deployment: this.deployment,
    //     post: this.post });
    // modal.onDidDismiss(data => {
    //   this.logger.info(this, "editResponse", "Modal", data);
    // });
  }

  addToCollection(post:Post) {
    this.logger.info(this, "addToCollection");
    this.showToast('Add To Collection Not Implemented');
  }

  archiveResponse(post:Post) {
    this.logger.info(this, "archiveResponse");
    let changes = { status: "archived" };
    let loading = this.showLoading("Archiving...");
    this.api.updatePost(this.deployment, post, changes).then(
      (updated) => {
        post.status = "archived";
        this.database.savePost(this.deployment, post).then(saved => {
          loading.dismiss();
          this.showToast("Responsed archived");
        });
      },
      (error) => {
        loading.dismiss();
        this.showAlert("Problme Updating Response", error);
      });
  }

  publishResponse(post:Post) {
    this.logger.info(this, "publishResponse");
    let changes = { status: "published" };
    let loading = this.showLoading("Publishing...");
    this.api.updatePost(this.deployment, post, changes).then(
      (updated) => {
        post.status = "published";
        this.database.savePost(this.deployment, post).then(saved => {
          loading.dismiss();
          this.events.publish('post:updated', post.id);
          this.showToast("Response archived");
        });
      },
      (error) => {
        loading.dismiss();
        this.showAlert("Problem Updating Response", error);
      });
  }

  deleteResponse(post:Post) {
    let buttons = [
       {
         text: 'Delete',
         role: 'destructive',
         handler: () => {
           this.logger.info(this, "deleteResponse", 'Delete');
           let loading = this.showLoading("Deleting...");
           this.api.deletePost(this.deployment, post).then(
             (results) => {
               loading.dismiss();
               this.database.removePost(this.deployment, post).then(removed => {
                 let postIndex = this.posts.indexOf(post, 0);
                 if (postIndex > -1) {
                   this.posts.splice(postIndex, 1);
                 }
                 let filteredIndex = this.filtered.indexOf(post, 0);
                 if (filteredIndex > -1) {
                   this.filtered.splice(filteredIndex, 1);
                 }
                 this.showToast("Response deleted");
              });
             },
             (error) => {
               loading.dismiss();
               this.showAlert("Problem Deleting Response", error);
             });
         }
       },
       {
         text: 'Cancel',
         role: 'cancel',
         handler: () => {
           this.logger.info(this, "deleteResponse", 'Cancel');
         }
       }
     ];
     this.showConfirm("Delete Response", "Are you sure you want to delete this response?", buttons);
  }

  showList(event:any) {
    this.logger.info(this, "showList");
    this.view = 'list';
    if (this.map) {
      this.map.setVisible(false);
    }
  }

  showMap(event:any, attempts:number=0) {
    this.logger.info(this, "showMap", attempts);
    this.view = 'map';
    let element: HTMLElement = document.getElementById('map');
    if (element) {
      if (this.map) {
        this.map.remove();
      }
      this.map = new GoogleMap(element,
        { 'backgroundColor': '#e7e9ec' });
      this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
        this.logger.info(this,  "showMap", 'Map Ready');
        let bounds = [];
        for (var i = 0; i <= this.posts.length; i++){
          let post = this.posts[i];
          if (post && post.latitude && post.longitude) {
            let latitude = Number(post.latitude);
            let longitude = Number(post.longitude);
            let coordinate: GoogleMapsLatLng = new GoogleMapsLatLng(latitude, longitude);
            this.logger.info(this, "showMap", "Coordinate", coordinate);
            this.map.addMarker({
              position: coordinate,
              title: post.title,
              snippet: post.description,
              infoClick: (marker) => {
                this.logger.info(this, "showMap", "Info", post.id);
                this.showResponse(post);
              },
              markerClick: (marker) => {
                this.logger.info(this, "showMap", "Marker", post.id);
                marker.showInfoWindow();
              },
            });
            bounds.push(coordinate);
          }
        }
        if (bounds.length > 0) {
          this.map.animateCamera({
            target: bounds,
            duration: 2000
          });
        }
      });
    }
    else {
      setTimeout((attempts) => {
        this.showMap(event, attempts+1);
      }, 1000, attempts);
    }
  }

  clearFilter(event:any, filter:Filter) {
    this.logger.info(this, "clearFilter", filter);
    this.database.removeFilters(this.deployment).then(
      (results) => {
        this.filter = null;
        this.filtered = this.getFiltered(this.posts, this.filter);
      },
      (error) => {
        this.showToast(error);
      });
      this.resizeContent();
  }

  resizeContent(delay:number=100) {
    this.logger.info(this, "resizeContent");
    setTimeout(() => {
      this.content.resize();
    }, delay);
  }
}
