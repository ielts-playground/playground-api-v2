/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8tg6l6qgkzjbo65")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "zz7gaqte",
    "name": "type",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "VERIFY_EMAIL",
        "RESET_PASSWORD"
      ]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8tg6l6qgkzjbo65")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "zz7gaqte",
    "name": "type",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "VERIFY_EMAIL"
      ]
    }
  }))

  return dao.saveCollection(collection)
})
