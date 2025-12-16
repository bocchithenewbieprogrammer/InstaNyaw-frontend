const HomePost = require("../models/HomePost");
const BirthdayGreeting = require("../models/BirthdayGreeting");
const Announcement = require("../models/Announcement");
const SchoolNews = require("../models/SchoolNews");
const LostAndFound = require("../models/LostAndFound");

module.exports = function findRealPost(postType) {
  switch (postType) {
    case "homepost":
      return HomePost;
    case "birthday":
      return BirthdayGreeting;
    case "announcement":
      return Announcement;
    case "news":
      return SchoolNews;
    case "lostfound":
      return LostAndFound;
    default:
      return null;
  }
};
