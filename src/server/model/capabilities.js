'use strict';

(function (exports, require, module) {

    class Capabilities {
        constructor() {
            this.None = 0x0;
            this.Admin = 0x1;
            this.Analisys = this.Admin * 2; // 0x10 - 2
            this.Segmentation = this.Analisys * 2; // 0x100 - 4
            this.Dev = this.Segmentation * 2; // 0x1000 - 8
            this.EditArticle = this.Dev * 2;  // 0x10000 - 16
            this.EditBlog = this.EditArticle * 2; // 0x100000 - 32
            this.LookALike = this.EditBlog * 2; // 64
            this.ExportToFile = this.LookALike * 2; // 128
            this.SearchByPhone = this.ExportToFile * 2; // 256
            this.PeoplesToExcel = this.SearchByPhone * 2; // 512

            this.All = this.Admin + this.Analisys + this.Segmentation + this.EditArticle + this.EditBlog + this.LookALike + this.SearchByPhone + this.peoplesToExcel;
        }
    }

    module.exports = new Capabilities();
})(module.exports, null, module);