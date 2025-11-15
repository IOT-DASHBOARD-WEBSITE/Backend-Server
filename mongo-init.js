// Only create user if it doesn't exist
if (!db.getUser('admin')) {
  db.createUser({
    user: 'admin',
    pwd: 'admin',
    roles: [{role: 'root', db: 'admin'}]
  });
  print('Admin user created successfully');
} else {
  print('Admin user already exists');
}
