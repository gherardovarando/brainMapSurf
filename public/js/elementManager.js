
"use strict";
/**
 * @author : Gherardo Varando (gherardo.varando@gmail.com)
 * @license: GPL v3
 *     This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */




/**
 * elementManager creator
 */
function elementManager(){

  /**
   * if no document exit
   */
  if (!document){
    console.log("impossibel to use elementManager without a document object");
  }


/**
 * create or assign the modalContainer element
 * @param  {string} id id of the modal container
 */
this.initialiseModalContainer = function(id){
  if (document){
  var cont =  document.getElementById(id);
  if (id && cont){
    this.modalContainer = {
      obj : cont,
      id : id
    };
  }
  else{
    cont = document.createElement("DIV");
    cont.id = "modal-container"
    document.getElementsByTagName("BODY")[0].appendChild(cont);
    this.initialiseProgressBarContainer("modal-container");
    }
  }
}

/**
 * create a new modal element
 * @param  {string} id         id for the new modal
 * @param  {string} header     text for the header
 * @param  {object} body       DOM node for the body
 * @return {object}            DOM node, the modal created, moreover in
 *                             the EL field of modal it is possible to acess
 *                             to the body, title and footer element of
 *                             the modal.
 */
  this.newModal = function(id, header, body) {
      if (document) {
          var modal = document.createElement("DIV");
          modal.id=id
          modal.className= "modal fade";
          modal.tabindex="-1";
          modal.role="dialog";
          modal.setAttribute("aria-labelledby", "aboutModalLabel");
          var dialog = document.createElement("DIV");
          dialog.className= "modal-dialog";
          dialog.role= "document";
          var content = document.createElement("DIV");
          content.className= "modal-content";
          var head = document.createElement("DIV");
          head.className = "modal-header";
          var button = document.createElement("BUTTON");
          button.setAttribute("type", "button");
          button.className =  "close";
          button.setAttribute("data-dismiss", "modal");
          button.setAttribute("aria-label", "Close");
          var span = document.createElement("SPAN");
          span.innerHTML = "&times;";
          var title = document.createElement("DIV");
          title.className =  "modal-title";
          title.id =  id + "-title";
          title.innerHTML = header;
          var bodyy = document.createElement("DIV");
          bodyy.className =  "modal-body";
          bodyy.id = id + "-body";
          button.appendChild(span);
          head.appendChild(button);
          head.appendChild(title);
          if (body) {
              bodyy.appendChild(body);
          }
          var footer = document.createElement("DIV");
          footer.class = "modal-footer";
          content.appendChild(head);
          content.appendChild(bodyy);
          content.appendChild(footer);
          dialog.appendChild(content);
          modal.appendChild(dialog);
          this.modalContainer.obj.appendChild(modal);
      }
  }


/**
 * create and add the progressBarContainer object
 * @param  {string} id  id of the container, if it exist it will be used the DOM object it refers to
 */
this.initialiseProgressBarContainer=function(id){
  var cont =  document.getElementById(id);
  if (id && cont){
    this.progressBarContainer = {
      obj : cont,
      id : id
    };
  }
  else{
    if (!id){
      var id = "progress-container";
    }
    cont = document.createElement("DIV");
    cont.id = id;
    cont.style.position = "absolute";
    cont.style.right = "0px";
    cont.style.top="0px";
    cont.style.width="250px";
    cont.style.padding="20px";
    document.getElementsByTagName("BODY")[0].appendChild(cont);
    this.initialiseProgressBarContainer("progress-container");
    }
}

/**
 * add a progress bar
 * @param {string} id id of the progress bar
 */
  this.addProgressBar = function(id) {
      if (document) {
          var cont = document.createElement("DIV");
          cont.setAttribute("class", "progress");
          cont.setAttribute("id", "parent" + id);
          var bar = document.createElement("DIV");
          bar.setAttribute("id", "progress-bar" + id);
          cont.appendChild(bar);
          bar.style["min-width"] = "2em";
          bar.setAttribute("class", "progress-bar");
          bar.setAttribute("role", "progressbar");
          bar.setAttribute("aria-valuenow", "100");
          bar.setAttribute("aria-valuemin", "0");
          bar.setAttribute("aria-valuemax", "100");
          bar.style.width = "0%";
          bar.innerHTML = "0%";
          this.progressBarContainer.obj.appendChild(cont);
      }
  }

/**
 * update the value of the progress bar
 * @param  {string} id    id of the progress bar to be updated
 * @param  {number} value new value for the progress bar
 */
  this.updateProgressBar = function(id, value) {
      if (document) {
          var temp = "" + value.toPrecision(3) + "%";
          var bar = document.getElementById("progress-bar" + id);
          bar.style.width = temp;
          bar.setAttribute("aria-valuenow", value);
          bar.innerHTML = temp;
      }
  }

/**
 * increase the progress bar one step
 * @param  {string} id    id of the progress bar to modify
 * @param  {number} value value to increase the progress bar with
 */
  this.stepProgressBar = function(id, value) {
      if (document) {
          if (!value){
            var value = 1;
          }
          var bar = document.getElementById("progress-bar" + id);
          var temp = parseInt(bar["aria-valuenow"]);
          temp = temp + value;
          bar.style.width = "" + temp + "%";
          bar.setAttribute("aria-valuenow", temp);
          bar.innerHTML = temp + "%";
      }
  }

/**
 * close the progress bar
 * @param  {string} id id of the progress bar to close
 */
this.closeProgressBar = function(id) {
      if (document) {
          var par = document.getElementById("parent" + id);
          if (par) {
              par.removeChild(document.getElementById("progress-bar" + id));
              document.getElementById("progress-container").removeChild(par);
          }
      }
  }




/**
 * add an Alert
 * @param {string} id         id of the alert object
 * @param {string} alertclass class of the alert like "alert-sucess"
 * @param {string} strongText title of the alert
 * @param {string} bodyText   text in the body
 * @param {string} icon       icon class like "fa fa-thumbs-o-up"
 */
  this.addAlert=function(id, alertclass, strongText, bodyText, icon) {
      if (document && state.alerts) {
          if (document.getElementById("id") != undefined) {
              var alert = document.getElementById("id");
          } else {
              var container = document.getElementById("alerts-container");
              var alert = document.createElement("DIV");
              container.appendChild(alert);
          }
          alert.setAttribute("class", "alert alert-dismissible fade in " + alertclass);
          alert.setAttribute("role", "alert");
          alert.setAttribute("id", id);
          var strong = document.createElement("STRONG");
          strong.setAttribute("id", id + "-strong")
          strong.innerHTML = " " + strongText;
          if (icon) {
              var span = document.createElement("I");
              span.setAttribute("class",  icon);
              alert.appendChild(span);
          }
          var button = document.createElement("BUTTON");
          button.setAttribute("type", "button");
          button.setAttribute("class", "close");
          button.setAttribute("data-dismiss", "alert");
          var sp = document.createElement("SPAN");
          sp.innerHTML = "&times;";
          button.appendChild(sp);
          alert.appendChild(button);
          alert.appendChild(strong);
          var body = document.createElement("P");
          body.setAttribute("id", id + "-body")
          body.innerHTML = bodyText;
          alert.appendChild(body);
      }
  }




  /**
   * Initialise the modal object for the warnings
   * and add it to the brainMap object and to the BODY
   * @return {[type]} [description]
   */
  this.initialiseWarningModal = function() {
      if (document) {
          var modal = newModal("warningModal", "Warning", null);
          document.getElementsByTagName("BODY")[0].appendChild(modal);
          var discl = document.createElement("DIV");
          discl.style = "font-size : 70%;";
          discl.innerHTML = "You can disable all the warning modals selecting the expert mode in setting";
          modal.EL.footer.appendChild(discl);
          this.modalWarning = modal;

      }
  }

  /**
   * not really working .....
   * @param {[type]}   id       [description]
   * @param {[type]}   btnTxt   [description]
   * @param {Function} callback [description]
   */
  this.addButtonToWarningModal = function(id, btnTxt, callback) {
      var self = this;
      if (document) {
          var btn = document.createElement("BUTTON");
          btn.class = "btn btn-default";
          btn.innerHTML = btnTxt;
          btn.id = id;
          $('#' + id).on('click', function() {
              callback();
              self.modalWarning.EL.footer.removeChild(btn);
              $('#' + id).modal('hide');
          });
          this.modalWarning.EL.footer.appendChild(btn);
      }
  }


  /**
   * Display the warning modal
   */
  this.showWarningModal = function() {
      if (document) {
          var modal = this.modalWarning;
          if (modal && !this.state.expertMode) {
              $('#warningModal').modal('toggle');
          }
      }
  }


  /**
   * Fill with simple text the warningModal
   * @param  {string} title   title of the modal
   * @param  {string} bodytxt text to put in the body of the modal
   */
  this.fillWarningModalSimple = function(title, bodytxt) {
      if (document && this.modalWarning) {
          var modal = this.modalWarning;
          /**
           * clean the modal body
           */
          empty(modal.EL.body, modal.EL.body.firstChild);

          /**
           * write the title
           */
          modal.EL.title.innerHTML = title;

          /**
           * write simple body
           */
          var txt = document.createElement("P");
          txt.innerHTML = bodytxt
          modal.EL.body.appendChild(txt);
      }
  }

  /**
   * fill the warning modal and then show it
   * @param  {string} title   title of the modal
   * @param  {string} bodytxt text in the body
   */
  this.fillAndShowWarningModal = function(title, bodytxt) {
      this.fillWarningModalSimple(title, bodytxt);
      this.showWarningModal();
  }
}
