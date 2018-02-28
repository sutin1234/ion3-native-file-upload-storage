import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { File, FileEntry } from '@ionic-native/file';
import { FileChooser } from '@ionic-native/file-chooser';
import { FilePath } from '@ionic-native/file-path';
import * as firebase from 'firebase';
import { AngularFireDatabase} from 'angularfire2/database';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [File, FileChooser, FilePath, AngularFireDatabase]
})
export class HomePage {
  myBlobFile: any;
  constructor(public navCtrl: NavController, private file: File,
              private fileChooser: FileChooser, private filePath: FilePath,
              private af: AngularFireDatabase) {

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
              this.uploadFileToStorage(meta);
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
    let task = storageRef.child('files/'+ fileObject.name).put(this.myBlobFile);
    task.on('state_changed', (snapshot: any) => {
      let uploading = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      console.log("upload is " + uploading + "% done");
      if(uploading == 100){
        alert('uploaded OK');
      }
    });
  }

}
