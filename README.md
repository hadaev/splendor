### create seed
`npx sequelize-cli seed:generate --name demo-user`

### run seed
`npx sequelize-cli db:seed:all`

### create migrate
`npx sequelize-cli migration:generate --name migration-skeleton`
`npx sequelize-cli model:generate --name User`

### run migrate
`npx sequelize-cli db:migrate`

