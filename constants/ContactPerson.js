class ContactPersonDesignation {
  static get ALLOWED_DESIGNATION() {
    return [
      "Owner",
      "Manager",
      "Head of youth development",
      "Head coach - Under 18/ 19",
      "Head coach - Under 16/ 15",
      "Head coach - Under 14/ 13",
      "Fitness coach",
      "Goalkeeping coach",
      "Video analyst",
      "Qualified physiotherapist",
      "Head of player recruitment/ chief scout",
    ];
  }
}

module.exports = ContactPersonDesignation;
