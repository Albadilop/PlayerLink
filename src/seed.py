from app import app, db
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash
from api.models import User, Profile, Review, Game, Match, Reject, Like
from sqlalchemy import select

with app.app_context():
    # db.drop_all()
    # db.create_all()

    # hashear la contraseña
    # def hash(pwd): return generate_password_hash(pwd) password=hash

    # Buscar si hay usuarios existentes en la base de datos
    existing_users = db.session.execute(select(User)).scalars().all()
    
    # Si hay usuarios existentes, usar el primero como user1
    if existing_users:
        user1 = existing_users[0]
        print(f"✅ Usando usuario existente: {user1.email} (ID: {user1.id})")
        # Crear solo 9 usuarios nuevos
        users_to_create = 9
    else:
        user1 = None
        users_to_create = 10
        print("ℹ️ No se encontraron usuarios existentes, creando 10 usuarios nuevos")

    #Creación de usuarios nuevos (9 si hay uno existente, 10 si no)
    new_users = []
    user_emails = [
        "juan.perez@example.com",
        "ana.gomez@example.com",
        "carlos.ruiz@example.com",
        "maria.lopez@example.com",
        "luis.fernandez@example.com",
        "laura.diaz@example.com",
        "jorge.martinez@example.com",
        "sofia.torres@example.com",
        "diego.ramirez@example.com",
        "carmen.vargas@example.com"
    ]
    
    # Si hay un usuario existente, empezar desde el índice 1, sino desde 0
    start_idx = 1 if user1 else 0
    
    for i in range(start_idx, users_to_create + start_idx):
        email = user_emails[i]
        # Verificar si el usuario ya existe antes de crearlo
        existing = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not existing:
            new_user = User(email=email, password=generate_password_hash("password123"))
            new_users.append(new_user)
        else:
            print(f"⚠️ Usuario {email} ya existe, omitiendo creación")
    
    if new_users:
        db.session.add_all(new_users)
        db.session.commit()
        print(f"✅ Creados {len(new_users)} usuarios nuevos")
    
    # Obtener todos los usuarios (el existente + los nuevos)
    all_users = db.session.execute(select(User).order_by(User.id)).scalars().all()
    
    # Si hay un usuario existente, asegurarse de que esté en la lista
    if user1 and user1 not in all_users:
        all_users.insert(0, user1)
    
    # Tomar los primeros 10 usuarios
    users = all_users[:10]
    
    # Asignar user1, user2, etc.
    user1 = users[0]
    user2 = users[1] if len(users) > 1 else None
    user3 = users[2] if len(users) > 2 else None
    user4 = users[3] if len(users) > 3 else None
    user5 = users[4] if len(users) > 4 else None
    user6 = users[5] if len(users) > 5 else None
    user7 = users[6] if len(users) > 6 else None
    user8 = users[7] if len(users) > 7 else None
    user9 = users[8] if len(users) > 8 else None
    user10 = users[9] if len(users) > 9 else None
    
    if not all([user1, user2, user3, user4, user5, user6, user7, user8, user9, user10]):
        print("❌ Error: No hay suficientes usuarios (se necesitan 10)")
        exit(1)
    
    print(f"✅ Total de usuarios disponibles: {len(users)}")
    
    # Obtener los IDs reales de los usuarios
    user_ids = [u.id for u in users]

    #Creación de los profiles de cada user (solo si no existen)
    profile_data = [
        {"gender": "Male", "age": 28, "name": "Juan Perez", "discord": "juan#1234", "preferences": "Action, Adventure", "zodiac": "Leo", "location": "Madrid", "nick_name": "juancito", "bio": "Gamer and developer passionate about competitive gaming", "language": "Spanish", "steam_id": "steam_juan123", "photo": "photo1"},
        {"gender": "Female", "age": 34, "name": "Ana Gomez", "discord": "ana_g#5678", "preferences": "RPG, Strategy", "zodiac": "Cancer", "location": "Barcelona", "nick_name": "anag", "bio": "Loves strategy games and building communities", "language": "Spanish", "steam_id": "steam_ana567", "photo": "photo2"},
        {"gender": "Male", "age": 22, "name": "Carlos Ruiz", "discord": "carlos#9999", "preferences": "FPS, Sports", "zodiac": "Aries", "location": "Valencia", "nick_name": "carlosR", "bio": "Competitive gamer always looking for challenges", "language": "Spanish", "steam_id": "steam_carlos999", "photo": "photo3"},
        {"gender": "Female", "age": 30, "name": "Maria Lopez", "discord": "maria#4567", "preferences": "Puzzle, Indie", "zodiac": "Virgo", "location": "Sevilla", "nick_name": "mariL", "bio": "Casual player who enjoys relaxing games", "language": "Spanish", "steam_id": "steam_maria456", "photo": "photo4"},
        {"gender": "Male", "age": 26, "name": "Luis Fernandez", "discord": "luisf#2345", "preferences": "RPG, Open World", "zodiac": "Taurus", "location": "Bilbao", "nick_name": "luisF", "bio": "Explores every map and completes every quest", "language": "Spanish", "steam_id": "steam_luis234", "photo": "photo5"},
        {"gender": "Female", "age": 29, "name": "Laura Diaz", "discord": "laura#9876", "preferences": "MMORPG, Strategy", "zodiac": "Pisces", "location": "Granada", "nick_name": "lauD", "bio": "Guild leader and team coordinator", "language": "Spanish", "steam_id": "steam_laura987", "photo": "photo6"},
        {"gender": "Male", "age": 33, "name": "Jorge Martinez", "discord": "jorge#1122", "preferences": "FPS, Racing", "zodiac": "Sagittarius", "location": "Zaragoza", "nick_name": "jorgeM", "bio": "Competitive and fast, always improving", "language": "Spanish", "steam_id": "steam_jorge112", "photo": "photo7"},
        {"gender": "Female", "age": 27, "name": "Sofia Torres", "discord": "sofia#3344", "preferences": "Simulation, Casual", "zodiac": "Gemini", "location": "Malaga", "nick_name": "sofiaT", "bio": "Love building and managing virtual worlds", "language": "Spanish", "steam_id": "steam_sofia334", "photo": "photo8"},
        {"gender": "Male", "age": 31, "name": "Diego Ramirez", "discord": "diego#5566", "preferences": "Fighting, Action", "zodiac": "Scorpio", "location": "Murcia", "nick_name": "diegoR", "bio": "Fighting game enthusiast and tournament player", "language": "Spanish", "steam_id": "steam_diego556", "photo": "photo9"},
        {"gender": "Female", "age": 25, "name": "Carmen Vargas", "discord": "carmen#7788", "preferences": "Horror, Adventure", "zodiac": "Libra", "location": "Alicante", "nick_name": "carmenV", "bio": "Thriller and horror game lover", "language": "Spanish", "steam_id": "steam_carmen778", "photo": "photo10"},
    ]
    
    profiles = []
    for i, user in enumerate(users):
        user_id = user.id
        # Verificar si el perfil ya existe
        existing_profile = db.session.execute(select(Profile).where(Profile.user_id == user_id)).scalar_one_or_none()
        if not existing_profile:
            profile_info = profile_data[i]
            profile = Profile(
                user_id=user_id,
                gender=profile_info["gender"],
                age=profile_info["age"],
                name=profile_info["name"],
                discord=profile_info["discord"],
                preferences=profile_info["preferences"],
                zodiac=profile_info["zodiac"],
                location=profile_info["location"],
                nick_name=profile_info["nick_name"],
                bio=profile_info["bio"],
                language=profile_info["language"],
                steam_id=profile_info["steam_id"],
                photo=profile_info["photo"]
            )
            profiles.append(profile)
        else:
            print(f"⚠️ Perfil para usuario {user.email} (ID: {user_id}) ya existe, omitiendo creación")
            profiles.append(existing_profile)
    
    if profiles:
        # Solo agregar los perfiles nuevos
        new_profiles = [p for p in profiles if p.id is None or not hasattr(p, 'id')]
        if new_profiles:
            db.session.add_all(new_profiles)
            db.session.commit()
            print(f"✅ Creados {len(new_profiles)} perfiles nuevos")
    
    # Asignar variables para facilitar el acceso
    profile1 = profiles[0]
    profile2 = profiles[1]
    profile3 = profiles[2]
    profile4 = profiles[3]
    profile5 = profiles[4]
    profile6 = profiles[5]
    profile7 = profiles[6]
    profile8 = profiles[7]
    profile9 = profiles[8]
    profile10 = profiles[9]

    #Crear games para los perfiles de usuarios (solo si no existen)
    games_data = [
        # Perfil 1
        [("Call of Duty", 120, "cod_image"), ("Halo Infinite", 90, "halo_image"), ("Celeste", 45, "celeste_image")],
        # Perfil 2
        [("Civilization VI", 200, "civ6_image"), ("Stardew Valley", 130, "stardew_image"), ("Divinity: Original Sin 2", 160, "divinity_image")],
        # Perfil 3
        [("FIFA 24", 150, "fifa_image"), ("NBA 2K24", 95, "nba_image"), ("Rocket League", 110, "rocket_image")],
        # Perfil 4
        [("Stardew Valley", 80, "stardew_image"), ("Unpacking", 40, "unpacking_image"), ("Gris", 30, "gris_image")],
        # Perfil 5
        [("The Witcher 3", 300, "witcher_image"), ("Skyrim", 250, "skyrim_image"), ("Zelda: BOTW", 180, "zelda_image")],
        # Perfil 6
        [("World of Warcraft", 500, "wow_image"), ("Age of Empires IV", 120, "aoe4_image"), ("Final Fantasy XIV", 400, "ffxiv_image")],
        # Perfil 7
        [("Forza Horizon 5", 220, "forza_image"), ("Valorant", 180, "valorant_image"), ("Gran Turismo 7", 150, "gt7_image")],
        # Perfil 8
        [("The Sims 4", 350, "sims4_image"), ("Animal Crossing", 200, "ac_image"), ("Cities: Skylines", 180, "cities_image")],
        # Perfil 9
        [("Street Fighter 6", 250, "sf6_image"), ("Tekken 8", 200, "tekken_image"), ("Mortal Kombat 1", 150, "mk1_image")],
        # Perfil 10
        [("Resident Evil 4", 120, "re4_image"), ("The Last of Us", 100, "tlou_image"), ("Alan Wake 2", 80, "alanwake_image")],
    ]
    
    games = []
    for i, profile in enumerate(profiles):
        profile_id = profile.id
        for game_title, hours, image in games_data[i]:
            # Verificar si el juego ya existe
            existing_game = db.session.execute(
                select(Game).where(Game.profile_id == profile_id, Game.game_title == game_title)
            ).scalar_one_or_none()
            if not existing_game:
                games.append(Game(profile_id=profile_id, game_title=game_title, game_hoursPlayed=hours, game_image=image))
    
    if games:
        db.session.add_all(games)
        db.session.commit()
        print(f"✅ Creados {len(games)} juegos nuevos")

    #Crear reviews para todos los usuarios (solo si no existen)
    reviews_data = [
        # Para cada usuario, lista de (author_index, stars, comment)
        [(1, 5, "Great player!"), (2, 4, "Very strategic."), (3, 3, "Good, but can improve."), (4, 4, "Fun to play with."), (5, 5, "Excellent teamwork."), (6, 3, "Needs more practice."), (7, 4, "Really fast and skilled."), (8, 5, "Top tier player."), (9, 4, "Great communication.")],
        [(0, 4, "Good communication."), (2, 5, "Amazing skills."), (3, 4, "Very helpful."), (4, 3, "Can improve timing."), (5, 4, "Nice player."), (6, 5, "Strong strategist."), (7, 4, "Great teamwork."), (8, 5, "Excellent leader."), (9, 4, "Very reliable.")],
        [(0, 3, "Average."), (1, 4, "Good playstyle."), (3, 5, "Excellent!"), (4, 4, "Reliable."), (5, 3, "Could be better."), (6, 4, "Consistent."), (7, 5, "Top player."), (8, 4, "Great skills."), (9, 5, "Amazing player.")],
        [(0, 4, "Nice teammate."), (1, 3, "Learning fast."), (2, 5, "Excellent moves."), (4, 4, "Friendly player."), (5, 4, "Very cooperative."), (6, 3, "Could improve strategy."), (7, 5, "Reliable player."), (8, 4, "Good teammate."), (9, 5, "Excellent player.")],
        [(0, 5, "Excellent teamwork."), (1, 4, "Good skills."), (2, 4, "Great at tactics."), (3, 5, "Fun to play with."), (5, 3, "Needs to communicate more."), (6, 4, "Strong player."), (7, 5, "Very strategic."), (8, 4, "Great player."), (9, 5, "Top tier.")],
        [(0, 3, "Can improve."), (1, 4, "Good teamwork."), (2, 5, "Great leader."), (3, 5, "Helpful player."), (4, 4, "Very skilled."), (6, 3, "Needs more practice."), (7, 4, "Consistent player."), (8, 5, "Excellent leader."), (9, 4, "Great coordination.")],
        [(0, 4, "Fast and skilled."), (1, 5, "Great strategist."), (2, 4, "Reliable player."), (3, 3, "Needs to focus more."), (4, 4, "Very cooperative."), (5, 5, "Excellent skills."), (7, 4, "Good teamwork."), (8, 5, "Top player."), (9, 4, "Great skills.")],
        [(0, 4, "Creative player."), (1, 5, "Great builder."), (2, 4, "Very organized."), (3, 5, "Excellent planner."), (4, 4, "Good strategist."), (5, 5, "Great leader."), (6, 4, "Reliable teammate."), (8, 5, "Excellent player."), (9, 4, "Very skilled.")],
        [(0, 5, "Amazing fighter."), (1, 4, "Great combos."), (2, 5, "Top tier skills."), (3, 4, "Very competitive."), (4, 5, "Excellent player."), (5, 4, "Great reflexes."), (6, 5, "Champion level."), (7, 4, "Very skilled."), (9, 5, "Top player.")],
        [(0, 4, "Brave player."), (1, 5, "Great survivor."), (2, 4, "Very strategic."), (3, 5, "Excellent under pressure."), (4, 4, "Great player."), (5, 5, "Top tier."), (6, 4, "Very skilled."), (7, 5, "Excellent player."), (8, 4, "Great teammate.")],
    ]
    
    reviews = []
    for i, user in enumerate(users):
        user_id = user.id
        for author_idx, stars, comment in reviews_data[i]:
            author_id = users[author_idx].id
            # Verificar si la review ya existe
            existing_review = db.session.execute(
                select(Review).where(Review.user_id == user_id, Review.author_id == author_id)
            ).scalar_one_or_none()
            if not existing_review:
                reviews.append(Review(user_id=user_id, author_id=author_id, stars=stars, comment=comment))
    
    if reviews:
        db.session.add_all(reviews)
        db.session.commit()
        print(f"✅ Creadas {len(reviews)} reviews nuevas")

    # Crear matches - Estrategia para que cada usuario tenga al menos 3 matches
    # Usuario 0: matches con 1, 2, 3
    # Usuario 1: matches con 0, 2, 4
    # Usuario 2: matches con 0, 1, 5
    # Usuario 3: matches con 0, 4, 6
    # Usuario 4: matches con 1, 3, 7
    # Usuario 5: matches con 2, 6, 8
    # Usuario 6: matches con 3, 5, 9
    # Usuario 7: matches con 4, 8, 9
    # Usuario 8: matches con 5, 7, 9
    # Usuario 9: matches con 6, 7, 8
    
    matches_data = [
        (0, 1, datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)),
        (0, 2, datetime(2024, 1, 16, 11, 30, 0, tzinfo=timezone.utc)),
        (0, 3, datetime(2024, 1, 17, 9, 45, 0, tzinfo=timezone.utc)),
        (1, 4, datetime(2024, 1, 18, 14, 0, 0, tzinfo=timezone.utc)),
        (2, 5, datetime(2024, 1, 19, 13, 15, 0, tzinfo=timezone.utc)),
        (3, 4, datetime(2024, 1, 20, 16, 45, 0, tzinfo=timezone.utc)),
        (3, 6, datetime(2024, 1, 21, 8, 30, 0, tzinfo=timezone.utc)),
        (4, 7, datetime(2024, 1, 22, 10, 15, 0, tzinfo=timezone.utc)),
        (5, 6, datetime(2024, 1, 23, 12, 0, 0, tzinfo=timezone.utc)),
        (5, 8, datetime(2024, 1, 24, 14, 30, 0, tzinfo=timezone.utc)),
        (6, 9, datetime(2024, 1, 25, 15, 45, 0, tzinfo=timezone.utc)),
        (7, 8, datetime(2024, 1, 26, 9, 0, 0, tzinfo=timezone.utc)),
        (7, 9, datetime(2024, 1, 27, 11, 20, 0, tzinfo=timezone.utc)),
        (8, 9, datetime(2024, 1, 28, 13, 10, 0, tzinfo=timezone.utc)),
    ]
    
    matches = []
    for user1_idx, user2_idx, created_at in matches_data:
        user1_id = users[user1_idx].id
        user2_id = users[user2_idx].id
        # Verificar si el match ya existe (en cualquier orden)
        existing_match = db.session.execute(
            select(Match).where(
                ((Match.user1_id == user1_id) & (Match.user2_id == user2_id)) |
                ((Match.user1_id == user2_id) & (Match.user2_id == user1_id))
            )
        ).scalar_one_or_none()
        if not existing_match:
            matches.append(Match(user1_id=user1_id, user2_id=user2_id, created_at=created_at))

    if matches:
        db.session.add_all(matches)
        db.session.commit()
        print(f"✅ Creados {len(matches)} matches nuevos")

    # Crear likes - Cada usuario debe tener al menos 4 likes dados
    # Usuario 0: likes a 1, 2, 3, 4 (4 likes)
    # Usuario 1: likes a 0, 2, 4, 5 (4 likes)
    # Usuario 2: likes a 0, 1, 5, 6 (4 likes)
    # Usuario 3: likes a 0, 4, 6, 7 (4 likes)
    # Usuario 4: likes a 1, 3, 7, 8 (4 likes)
    # Usuario 5: likes a 2, 6, 8, 9 (4 likes)
    # Usuario 6: likes a 3, 5, 9, 0 (4 likes)
    # Usuario 7: likes a 4, 8, 9, 1 (4 likes)
    # Usuario 8: likes a 5, 7, 9, 2 (4 likes)
    # Usuario 9: likes a 6, 7, 8, 3 (4 likes)
    
    likes_data = [
        [1, 2, 3, 4],  # Usuario 0
        [0, 2, 4, 5],  # Usuario 1
        [0, 1, 5, 6],  # Usuario 2
        [0, 4, 6, 7],  # Usuario 3
        [1, 3, 7, 8],  # Usuario 4
        [2, 6, 8, 9],  # Usuario 5
        [3, 5, 9, 0],  # Usuario 6
        [4, 8, 9, 1],  # Usuario 7
        [5, 7, 9, 2],  # Usuario 8
        [6, 7, 8, 3],  # Usuario 9
    ]
    
    likes = []
    for i, user in enumerate(users):
        liker_id = user.id
        for liked_idx in likes_data[i]:
            liked_id = users[liked_idx].id
            # Verificar si el like ya existe
            existing_like = db.session.execute(
                select(Like).where(Like.liker_id == liker_id, Like.liked_id == liked_id)
            ).scalar_one_or_none()
            if not existing_like:
                likes.append(Like(liker_id=liker_id, liked_id=liked_id))

    if likes:
        db.session.add_all(likes)
        db.session.commit()
        print(f"✅ Creados {len(likes)} likes nuevos")

    # Crear algunos rejects para hacer el seed más realista
    rejects_data = [
        (0, 5, datetime(2024, 1, 15, 12, 0, 0, tzinfo=timezone.utc)),
        (1, 6, datetime(2024, 1, 16, 13, 15, 0, tzinfo=timezone.utc)),
        (2, 7, datetime(2024, 1, 17, 14, 30, 0, tzinfo=timezone.utc)),
        (3, 8, datetime(2024, 1, 18, 15, 45, 0, tzinfo=timezone.utc)),
        (4, 9, datetime(2024, 1, 19, 16, 0, 0, tzinfo=timezone.utc)),
        (5, 0, datetime(2024, 1, 20, 17, 30, 0, tzinfo=timezone.utc)),
        (6, 1, datetime(2024, 1, 21, 18, 45, 0, tzinfo=timezone.utc)),
        (7, 2, datetime(2024, 1, 22, 19, 0, 0, tzinfo=timezone.utc)),
        (8, 3, datetime(2024, 1, 23, 20, 15, 0, tzinfo=timezone.utc)),
        (9, 4, datetime(2024, 1, 24, 21, 30, 0, tzinfo=timezone.utc)),
    ]
    
    rejects = []
    for rejector_idx, rejected_idx, created_at in rejects_data:
        rejector_id = users[rejector_idx].id
        rejected_id = users[rejected_idx].id
        # Verificar si el reject ya existe
        existing_reject = db.session.execute(
            select(Reject).where(Reject.rejector_id == rejector_id, Reject.rejected_id == rejected_id)
        ).scalar_one_or_none()
        if not existing_reject:
            rejects.append(Reject(rejector_id=rejector_id, rejected_id=rejected_id, created_at=created_at))

    if rejects:
        db.session.add_all(rejects)
        db.session.commit()
        print(f"✅ Creados {len(rejects)} rejects nuevos")

    print("✅ Data seeded successfully")
    print(f"✅ Created 10 users with profiles")
    print(f"✅ Created {len(games)} games")
    print(f"✅ Created {len(reviews)} reviews")
    print(f"✅ Created {len(matches)} matches (each user has at least 3 matches)")
    print(f"✅ Created {len(likes)} likes (each user has at least 4 likes)")
    print(f"✅ Created {len(rejects)} rejects")
