$(document).ready(function () {
  // URL de l'API
  const URL = "https://fast-reaches-82309.herokuapp.com/";

  // Les variables de l'état de l'application
  var currentUser = {};
  var activeRoom = {};

  // Fonctions de test de l'état

  /**
   * L'utilisateur est connecté si :
   *  - l'objet currentUser possède une clef id
   *  - cet id n'est pas vide (null, undefined ou 0)
   * @returns boolean
   */
  function isUserConnected() {
    return "id" in currentUser && currentUser.id;
  }

  /**
   * Le salon est sélectionné si :
   *  - l'objet activeRoom possède une clef id
   *  - cet id n'est pas vide (null, undefined ou 0)
   * @returns boolean
   */
  function isRoomSelected() {
    return "id" in activeRoom && activeRoom.id;
  }

  // Cibles du DOM de l'application
  const $loginModal = $("#loginModal");
  const $loginForm = $("#loginForm");
  const $registerModal = $("#registerModal");
  const $registerForm = $("#registerForm");
  const $messageForm = $("#messageForm");
  const $roomForm = $("#roomForm");
  const $userInfos = $("#userInfos");
  const $alert = $("#alert");
  const $roomContainer = $("#roomContainer");
  const $messagesContainer = $("#messagesContainer");
  const $messageTemplate = $("#messageTemplate").clone().removeAttr("id");

  // Initialisation de l'application
  $alert.hide();
  $userInfos.hide();
  $roomContainer.children("ul").empty();
  $("#messageTemplate").hide();
  $messageForm.find("button, textarea").prop("disabled", true);
  $roomForm.find("button, input").prop("disabled", true);

  // Sérialisation sous forme d'objet
  // input pour login et pwd résultat de $(form).serializeArray()
  // [{name: "login", value: "aaaa"}, {name: "pwd", value: "123"}]
  // Ce que je veux obtenir
  // {login: "aaa", pwd: "123"}
  function serializeObject(input) {
    let data = {};
    for (item of input) {
      data[item.name] = item.value;
    }
    return data;
  }

  /**
   * Affichage d'un message temporaire à l'écran
   * @param {string} text : Le texte du message
   * @param {string} className : La classe Bootstrap alert-[color] du message
   * Exemples :
   * showMessage("Vous êtes connecté");
   * showMessage("Connexion impossible", "alert-danger");
   */
  function showMessage(text, className = "alert-success") {
    $alert.html(text);
    if (className == "alert-danger") {
      $alert.addClass(className);
      $alert.removeClass("alert-success");
    } else {
      $alert.addClass(className);
      $alert.removeClass("alert-danger");
    }

    $alert.show();

    console.log($alert);

    setTimeout(function () {
      $alert.hide();
    }, 3000);
  }

  /**
   * Affiche le nom de l'utilisateur connecté
   * ainsi que le salon actif dans une zone de l'écran
   * ciblé par $userInfos
   */
  function showUserInfos() {
    // initialisation du message
    let message = "";

    // infos utilisateur
    if (isUserConnected()) {
      message += "Bonjour " + currentUser.name;
    }

    if (isRoomSelected()) {
      message += " vous êtes dans le salon " + activeRoom.title;
    }

    // Affichage dans la cible
    $userInfos.show().children("h4").html(message);
  }
  /**
   * Vide la saisie d'un formulaire
   * @param {jQueryObject} target : Le formulaire à vider
   */
  function resetForm(target) {
    $(target).find("input, textarea, select").val("");
  }

  // Traitement de l'inscription
  $registerForm.submit(function (event) {
    // Empêcher l'envoi du formulaire
    event.preventDefault();

    // Récupération des données
    const data = serializeObject($(this).serializeArray());

    // Validation des données
    if (!data.name || !data.login || !data.password) {
      showMessage("Saisie invalide", "alert-danger");
      // Arrête la fonction
      return;
    }

    // Envoi des données par le biais d'une requête AJAX sur l'API
    $.post(URL + "user", data)
      // succès
      .done(function (response) {
        // Affichage du message
        showMessage("Vous êtes inscrit et connecté");
        // Affectation de l'uilisateur
        currentUser = response[response.length - 1];
        // RAZ du formulaire
        resetForm($(this));
        // Fermeture de la fenêtre modale
        $registerModal.modal("hide");

        // Affichage des infos utilisateur
        showUserInfos();
        // Afficher la liste des salons
        showRoomList();
      })
      // Echec
      .fail(function (err) {
        console.log(err);
        showMessage("Inscription impossible", "alert-danger");
      });
  });

  // Traitement de la connexion
  $loginForm.submit(function (event) {
    // Empêcher l'envoi du formulaire
    event.preventDefault();

    // Récupération des données
    const data = serializeObject($(this).serializeArray());

    // Validation des données
    if (!data.login || !data.password) {
      showMessage("Saisie invalide", "alert-danger");
      // Arrête la fonction
      return;
    }

    // Envoi des données par le biais d'une requête AJAX sur l'API
    $.post(URL + "login", data)
      // succès
      .done(function (response) {
        // Affichage du message
        showMessage("Vous êtes connecté");
        // Affectation de l'uilisateur
        currentUser = response;
        // RAZ du formulaire
        resetForm($(this));
        // Fermeture de la fenêtre modale
        $loginModal.modal("hide");

        // Affichage des infos utilisateur
        showUserInfos();
        //Afficher la liste des salons
        showRoomList();
      })
      // Echec
      .fail(function (err) {
        console.log(err);
        showMessage("Connexion impossible", "alert-danger");
      });
  }); // Fin de submit sur login

  // Affichage des salons
  function showRoomList() {
    // Activation du formulaire de création de salon
    $roomForm.find("button, input").prop("disabled", false);

    // Requête AJAX pour obtenir la liste des salons
    $.get(URL + "room")
      // succès
      .done(function (response) {
        // Récupération du parent des élements de liste
        const $parent = $roomContainer.children("ul");
        // Efface les enfants
        $parent.empty();

        // Boucle sur la response pour créer de nouveaux enfants
        for (let room of response) {
          // Création du <li> qui représente un salon
          let $li = $(`<li class="list-group-item">${room.title}</li>`);
          // Enregistrement des données du salon dans le <li>
          $li.data("room", JSON.stringify(room));

          // attribuer la classe active au salon en cours
          if (activeRoom.id === room.id) {
            $li.addClass("active");
          }

          // Ajout du <li> au parent
          $parent.append($li);
        }
      }) //.fail(err => console.log(err));
      .fail(function (err) {
        console.log(err);
      });
  }

  // clic sur un salon
  $roomContainer.delegate("li", "click", function () {
    // Récupération des données du salon
    let room = $(this).data("room");
    // désserialisation des données (convertir en objet)
    room = JSON.parse(room);
    // Définition du salon actif
    activeRoom = room;
    // Mise à jour des infos utilisateur
    showUserInfos();

    // Désactivation des salons
    $roomContainer.find("li").removeClass("active");
    // Activation du salon
    $(this).addClass("active");

    // Activation du formulaire des messages
    $messageForm.find("button, textarea").prop("disabled", false);

    //Affichage de la liste des messages
    showMessageList();
  });

  // Affichage des messages du salon  actif
  function showMessageList() {
    // Cas d'exception qui ne doit pas arriver
    // mais Murphy is alive
    if (!isRoomSelected()) {
      return;
    }

    // Requête AJAX pour récupérer les message d'un salon
    $.get(URL + "room/" + activeRoom.id)
      .done(function (response) {
        // Effacer les message existants
        $messagesContainer.empty();
        // trier les messages par ordre décroissant de l'id
        response.messages.sort((a, b) => b.id - a.id);
        response.messages = response.messages.slice(0, 7);

        // boucle sur les messages de la response
        for (let message of response.messages) {
          // Clone du template
          const $messageDiv = $messageTemplate.clone();

          // Classe pour les messages de l'utilisateur connecté
          let classNames = ["mr-5", "bg-warning"];
          if (message.userId != currentUser.id) {
            classNames = ["ml-5", "bg-success"];
          }

          $messageDiv.addClass(classNames);

          let createdAt = new Date(message.id).toLocaleTimeString();

          // Ecriture des données du message dans la div
          $messageDiv
            .children("h4")
            .html(`A ${createdAt} ${message.user.name} dit :`);
          $messageDiv.children("p").html(message.text);

          // Ajout du message au DOM
          $messagesContainer.append($messageDiv);
        }
      })
      .fail((err) => console.log(err));
  }

  // Création d'un nouveau message
  $messageForm.submit(function (event) {
    // Empêche l'envoi du formulaire
    event.preventDefault();
    // Récupération des données
    let data = serializeObject($(this).serializeArray());
    // Ajout des données du salon et de l'utilisateur
    data.userId = currentUser.id;
    data.roomId = activeRoom.id;

    // Envoi des données à l'API pour création du message
    $.post(URL + "message", data)
      .done(function (response) {
        console.log(response);
        showMessage("Votre message est enregistré");
        showMessageList();
      })
      .fail(function (err) {
        console.log(err);
        showMessage("Impossible de créer le message", "alert-danger");
      })
      .always(function () {
        resetForm($messageForm);
      });
  });

  // Création d'un salon
  $roomForm.submit(function (event) {
    event.preventDefault();
    let data = serializeObject($(this).serializeArray());
    data.userId = currentUser.id;

    $.post(URL + "room", data)
      .done(function (response) {
        showMessage("Votre salon est ouvert");
        // Changer le salon actif
        activeRoom = response[response.length - 1];
        // Raffraichir la liste des salons
        showRoomList();
        resetForm($roomForm);
      })
      .fail(function (err) {
        showMessage("Impossible d'ouvrir le salon", "alert-danger");
        console.log(err);
      });
  });

  setInterval(function () {
    if (isRoomSelected() && isUserConnected()) {
      showMessageList();
      showRoomList();
    }
  }, 1000);
}); // Fin de ready
