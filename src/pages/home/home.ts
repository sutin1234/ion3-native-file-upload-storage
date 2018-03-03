import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { File, FileEntry } from '@ionic-native/file';
import { FileChooser } from '@ionic-native/file-chooser';
import { FilePath } from '@ionic-native/file-path';
import * as firebase from 'firebase';
import { AngularFireDatabase} from 'angularfire2/database';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [File, FileChooser, FilePath, AngularFireDatabase, AngularFirestore]
})
export class HomePage {
  myBlobFile: any;
  myFiles: Observable<any>;
  private myFilesCollection: AngularFirestoreCollection<any>;

  constructor(public navCtrl: NavController, private file: File,
              private fileChooser: FileChooser, private filePath: FilePath,
              private af: AngularFireDatabase, db: AngularFirestore) {
    this.myFilesCollection = db.collection('myFilesCollections');
    this.myFiles = this.myFilesCollection.valueChanges();
  }
  selectedFile(){
    this.fileChooser.open().then((uri) => {
      this.filePath.resolveNativePath(uri).then(filePath => {
        this.getEntry(filePath).then(meta => {
          // FileObject
            console.log(JSON.stringify(meta))
            let index = filePath.lastIndexOf('/'), finalPath = filePath.substr(0, index);
            this.file.readAsArrayBuffer(finalPath, meta.name).then((file) => {
              let blob = new Blob([file], {type: meta.type});
              this.myBlobFile = blob;
              this.uploadFileToStorage(meta).then(uploadUrl => {
                this.onSaveFirestore(uploadUrl, meta.name);
              });
            });
        });

      })
      .catch(err => {
        alert('filePath err '+ JSON.stringify(err))
      })
    }).catch(err => {
      alert('err '+ JSON.stringify(err))
    });
  }

  getEntry(filePath): Promise<any>{
    return new Promise((resolve, reject) => {
      this.file.resolveLocalFilesystemUrl(filePath).then((entry: FileEntry) => {
        entry.file(meta => resolve(meta));
      });
    });

  }
  uploadFileToStorage(fileObject){
    let storageRef =  firebase.storage().ref();
    return new Promise((resolve, reject) => {
      let task = storageRef.child('files/'+ fileObject.name).put(this.myBlobFile);
        task.on('state_changed', (snapshot: any) => {
            let uploading = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            console.log("upload is " + uploading + "% done");
        },(err) => {
          alert('Upload Err '+ JSON.stringify(err));
        },() => {
          alert('uploaded OK');
          resolve(task.snapshot.downloadURL);
        });
    });

  }
  async onSaveFirestore(fileUploadUrls, name){
    let data = {
      name: name,
      fileUploadUrl: fileUploadUrls,
    }
    this.myFilesCollection.add(data).then(() => {
      alert('add file success');
    }).catch(err => {
      console.log(JSON.stringify(err))
    });
  }
  downloadFile(file){
     let storageRef =  firebase.storage().ref();
     let task = storageRef.child('files/'+ file.name);
     task.getDownloadURL().then(url => {
       window.location.href = url;
     })
  }

}
