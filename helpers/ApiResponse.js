
'use strict'; 

const url = require("url") ;

class ApiResponse {

    constructor(data, page, pageCount, limit,totalCount) {
        this.data = data;
        this.page = page;
        this.pageCount = pageCount;
        this.limit = limit;
        this.totalCount = totalCount;
    }

    addSelfLink(req) {
        let appUrl = req.protocol + '://' + req.get('host') + url.parse(req.originalUrl).pathname;
        this.links.self = appUrl + "?page=" + this.page + "&limit=" + this.limit;
    }

    addNextLink(req) {
        let appUrl = req.protocol + '://' + req.get('host') + url.parse(req.originalUrl).pathname;
        let afterPage = this.page + 1;
        this.links.next = appUrl + "?page=" + afterPage + "&limit=" + this.limit;
        this.links.last = appUrl + "?page=" + this.pageCount + "&limit=" + this.limit;
    }

    addPrevLink(req) {
        let appUrl = req.protocol + '://' + req.get('host') + url.parse(req.originalUrl).pathname;
        let prevPage = this.page - 1;
        this.links.first = appUrl + "?page=1" + "&limit=" + this.limit;
        this.links.prev = appUrl + "?page=" + prevPage + "&limit=" + this.limit;
    }

}



exports.ApiResponse = ApiResponse ;