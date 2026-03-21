-- 002_seed.sql
-- 단어 세트 및 문장 세트 데이터 삽입

WITH
  s1 AS (INSERT INTO sets (id, name, type) VALUES (gen_random_uuid(), '외우기 어렵다', 'word') RETURNING id),
  s2 AS (INSERT INTO sets (id, name, type) VALUES (gen_random_uuid(), '단어장', 'word') RETURNING id),
  s3 AS (INSERT INTO sets (id, name, type) VALUES (gen_random_uuid(), '식재료1', 'word') RETURNING id),
  s4 AS (INSERT INTO sets (id, name, type) VALUES (gen_random_uuid(), '식당 메뉴1', 'word') RETURNING id),
  s5 AS (INSERT INTO sets (id, name, type) VALUES (gen_random_uuid(), '예시 문장', 'sent') RETURNING id),

  -- 세트1 "외우기 어렵다" 단어
  w1 AS (
    INSERT INTO words (set_id, jp, hira, ko, sort_order)
    SELECT id, '面白い', 'おもしろい', '재미있다', 1 FROM s1
    UNION ALL SELECT id, 'びっくりする', 'びっくりする', '놀라다', 2 FROM s1
    UNION ALL SELECT id, '経験', 'けいけん', '경험', 3 FROM s1
    UNION ALL SELECT id, '疲れた', 'つかれた', '힘들다 (지치다)', 4 FROM s1
    UNION ALL SELECT id, 'お腹が空いた', 'おなかがすいた', '배고프다', 5 FROM s1
    UNION ALL SELECT id, 'お腹がいっぱい', 'おなかがいっぱい', '배부르다', 6 FROM s1
    UNION ALL SELECT id, '研究', 'けんきゅう', '연구', 7 FROM s1
    UNION ALL SELECT id, '難しい', 'むずかしい', '어렵다', 8 FROM s1
    UNION ALL SELECT id, '優しい', 'やさしい', '쉽다', 9 FROM s1
    UNION ALL SELECT id, '忙しい', 'いそがしい', '바쁘다', 10 FROM s1
    UNION ALL SELECT id, '幸せだ', 'しあわせだ', '행복하다', 11 FROM s1
    UNION ALL SELECT id, '惜しい', 'おしい', '아쉽다', 12 FROM s1
    UNION ALL SELECT id, '計画', 'けいかく', '계획', 13 FROM s1
    RETURNING id
  ),

  -- 세트2 "단어장" 단어
  w2 AS (
    INSERT INTO words (set_id, jp, hira, ko, sort_order)
    SELECT id, '指定席', 'していせき', '지정석', 1 FROM s2
    UNION ALL SELECT id, '自由席', 'じゆうせき', '자유석', 2 FROM s2
    UNION ALL SELECT id, '行き', 'ゆき', '가는 편', 3 FROM s2
    UNION ALL SELECT id, '帰り', 'かえり', '오는 편', 4 FROM s2
    UNION ALL SELECT id, '往復', 'おうふく', '왕복', 5 FROM s2
    UNION ALL SELECT id, '片道', 'かたみち', '편도', 6 FROM s2
    UNION ALL SELECT id, '切符', 'きっぷ', '표', 7 FROM s2
    UNION ALL SELECT id, '窓側', 'まどがわ', '창가 좌석', 8 FROM s2
    UNION ALL SELECT id, '通路側', 'つうろがわ', '복도 좌석', 9 FROM s2
    UNION ALL SELECT id, '予約', 'よやく', '예약', 10 FROM s2
    UNION ALL SELECT id, '麺', 'めん', '면', 11 FROM s2
    UNION ALL SELECT id, '特製', 'とくせい', '특제', 12 FROM s2
    UNION ALL SELECT id, 'つけそば', 'つけそば', '츠케소바', 13 FROM s2
    UNION ALL SELECT id, '味玉', 'あじたま', '맛달걀', 14 FROM s2
    UNION ALL SELECT id, 'しょうゆらぁめん', 'しょうゆらぁめん', '간장 라멘', 15 FROM s2
    UNION ALL SELECT id, 'しおらぁめん', 'しおらぁめん', '소금 라멘', 16 FROM s2
    UNION ALL SELECT id, 'チャーシュー', 'ちゃーしゅー', '차슈', 17 FROM s2
    UNION ALL SELECT id, '増量', 'ぞうりょう', '증량', 18 FROM s2
    UNION ALL SELECT id, 'のり', 'のり', '김', 19 FROM s2
    UNION ALL SELECT id, 'メンマ', 'めんま', '멘마 (죽순)', 20 FROM s2
    UNION ALL SELECT id, 'ネギ', 'ねぎ', '파', 21 FROM s2
    UNION ALL SELECT id, '円', 'えん', '엔 (화폐 단위)', 22 FROM s2
    UNION ALL SELECT id, '面白い', 'おもしろい', '재미있다', 23 FROM s2
    UNION ALL SELECT id, 'びっくりする', 'びっくりする', '놀라다', 24 FROM s2
    UNION ALL SELECT id, '疲れた', 'つかれた', '힘들다 (지치다)', 25 FROM s2
    UNION ALL SELECT id, 'お腹が空いた', 'おなかがすいた', '배고프다', 26 FROM s2
    UNION ALL SELECT id, 'お腹がいっぱい', 'おなかがいっぱい', '배부르다', 27 FROM s2
    UNION ALL SELECT id, '難しい', 'むずかしい', '어렵다', 28 FROM s2
    UNION ALL SELECT id, '優しい', 'やさしい', '쉽다', 29 FROM s2
    UNION ALL SELECT id, '忙しい', 'いそがしい', '바쁘다', 30 FROM s2
    UNION ALL SELECT id, '幸せだ', 'しあわせだ', '행복하다', 31 FROM s2
    UNION ALL SELECT id, '惜しい', 'おしい', '아쉽다', 32 FROM s2
    UNION ALL SELECT id, '集まる', 'あつまる', '모이다', 33 FROM s2
    UNION ALL SELECT id, '歩く', 'あるく', '걷다', 34 FROM s2
    UNION ALL SELECT id, '写す', 'うつす', '베끼다 찍다', 35 FROM s2
    UNION ALL SELECT id, '売る', 'うる', '팔다', 36 FROM s2
    UNION ALL SELECT id, '起きる', 'おきる', '일어나다', 37 FROM s2
    UNION ALL SELECT id, 'お正月', 'おしょうがつ', '양력설', 38 FROM s2
    UNION ALL SELECT id, '暑さ', 'あつさ', '더위', 39 FROM s2
    UNION ALL SELECT id, '動く', 'うごく', '움직이다', 40 FROM s2
    UNION ALL SELECT id, '送る', 'おくる', '보내다', 41 FROM s2
    UNION ALL SELECT id, '終わる', 'おわる', '끝나다', 42 FROM s2
    UNION ALL SELECT id, '近所', 'きんじょ', '근처', 43 FROM s2
    UNION ALL SELECT id, '経験', 'けいけん', '경험', 44 FROM s2
    UNION ALL SELECT id, '研究', 'けんきゅう', '연구', 45 FROM s2
    UNION ALL SELECT id, '工場', 'こうじょう', '공장', 46 FROM s2
    UNION ALL SELECT id, '帰る', 'かえる', '돌아가다', 47 FROM s2
    UNION ALL SELECT id, '軽い', 'かるい', '가볍다', 48 FROM s2
    UNION ALL SELECT id, '計画', 'けいかく', '계획', 49 FROM s2
    UNION ALL SELECT id, '品物', 'しなもの', '물건', 50 FROM s2
    UNION ALL SELECT id, '知る', 'しる', '알다', 51 FROM s2
    UNION ALL SELECT id, '進む', 'すすむ', '진행되다', 52 FROM s2
    UNION ALL SELECT id, '世話', 'せわ', '보살핌 도와줌', 53 FROM s2
    UNION ALL SELECT id, '社会', 'しゃかい', '사회', 54 FROM s2
    UNION ALL SELECT id, '小説', 'しょうせつ', '소설', 55 FROM s2
    UNION ALL SELECT id, '西洋', 'せいよう', '서양', 56 FROM s2
    UNION ALL SELECT id, '祖母', 'そぼ', '조모 할머니', 57 FROM s2
    UNION ALL SELECT id, '大使館', 'たいしかん', '대사관', 58 FROM s2
    UNION ALL SELECT id, '着く', 'つく', '도착하다', 59 FROM s2
    UNION ALL SELECT id, '遠く', 'とおく', '멀리', 60 FROM s2
    UNION ALL SELECT id, '建物', 'たてもの', '건물', 61 FROM s2
    UNION ALL SELECT id, '中止', 'ちゅうし', '중지', 62 FROM s2
    UNION ALL SELECT id, '都会', 'とかい', '도시', 63 FROM s2
    UNION ALL SELECT id, '止まる', 'とまる', '멈추다', 64 FROM s2
    UNION ALL SELECT id, '台所', 'だいどころ', '부엌', 65 FROM s2
    UNION ALL SELECT id, '力', 'ちから', '힘', 66 FROM s2
    UNION ALL SELECT id, '都合', 'つごう', '사정', 67 FROM s2
    UNION ALL SELECT id, '特急', 'とっきゅう', '특급', 68 FROM s2
    UNION ALL SELECT id, '夏', 'なつ', '여름', 69 FROM s2
    UNION ALL SELECT id, '二台', 'にだい', '2대 두 대', 70 FROM s2
    UNION ALL SELECT id, '運ぶ', 'はこぶ', '운반하다 옮기다', 71 FROM s2
    UNION ALL SELECT id, '場所', 'ばしょ', '장소', 72 FROM s2
    UNION ALL SELECT id, '働く', 'はたらく', '일하다', 73 FROM s2
    UNION ALL SELECT id, '古い', 'ふるい', '오래되다 낡다', 74 FROM s2
    UNION ALL SELECT id, '文学', 'ぶんがく', '문학', 75 FROM s2
    RETURNING id
  ),

  -- 세트3 "식재료1" 단어
  w3 AS (
    INSERT INTO words (set_id, jp, hira, ko, sort_order)
    SELECT id, '牛肉', 'ぎゅうにく', '소고기', 1 FROM s3
    UNION ALL SELECT id, '豚肉', 'ぶたにく', '돼지고기', 2 FROM s3
    UNION ALL SELECT id, '鶏肉', 'とりにく', '닭고기', 3 FROM s3
    UNION ALL SELECT id, 'ひき肉', 'ひきにく', '다진 고기', 4 FROM s3
    UNION ALL SELECT id, 'ラム', 'らむ', '양고기', 5 FROM s3
    UNION ALL SELECT id, 'ハム', 'はむ', '햄', 6 FROM s3
    UNION ALL SELECT id, 'ソーセージ', 'そーせーじ', '소시지', 7 FROM s3
    UNION ALL SELECT id, 'ベーコン', 'べーこん', '베이컨', 8 FROM s3
    UNION ALL SELECT id, 'カルビ', 'かるび', '갈비', 9 FROM s3
    UNION ALL SELECT id, 'ホルモン', 'ほるもん', '곱창 내장', 10 FROM s3
    UNION ALL SELECT id, '魚', 'さかな', '생선', 11 FROM s3
    UNION ALL SELECT id, '鮭', 'さけ', '연어', 12 FROM s3
    UNION ALL SELECT id, 'まぐろ', 'まぐろ', '참치', 13 FROM s3
    UNION ALL SELECT id, 'さば', 'さば', '고등어', 14 FROM s3
    UNION ALL SELECT id, 'さんま', 'さんま', '꽁치', 15 FROM s3
    UNION ALL SELECT id, 'たい', 'たい', '도미', 16 FROM s3
    UNION ALL SELECT id, 'えび', 'えび', '새우', 17 FROM s3
    UNION ALL SELECT id, 'かに', 'かに', '게', 18 FROM s3
    UNION ALL SELECT id, 'いか', 'いか', '오징어', 19 FROM s3
    UNION ALL SELECT id, 'たこ', 'たこ', '문어', 20 FROM s3
    UNION ALL SELECT id, '貝', 'かい', '조개', 21 FROM s3
    UNION ALL SELECT id, 'ホタテ', 'ほたて', '가리비', 22 FROM s3
    UNION ALL SELECT id, 'うに', 'うに', '성게알', 23 FROM s3
    UNION ALL SELECT id, 'いくら', 'いくら', '연어알', 24 FROM s3
    UNION ALL SELECT id, 'わかめ', 'わかめ', '미역', 25 FROM s3
    UNION ALL SELECT id, '昆布', 'こんぶ', '다시마', 26 FROM s3
    UNION ALL SELECT id, '海苔', 'のり', '김', 27 FROM s3
    UNION ALL SELECT id, '野菜', 'やさい', '채소', 28 FROM s3
    UNION ALL SELECT id, 'キャベツ', 'きゃべつ', '양배추', 29 FROM s3
    UNION ALL SELECT id, 'レタス', 'れたす', '양상추', 30 FROM s3
    UNION ALL SELECT id, 'トマト', 'とまと', '토마토', 31 FROM s3
    UNION ALL SELECT id, 'きゅうり', 'きゅうり', '오이', 32 FROM s3
    UNION ALL SELECT id, 'なす', 'なす', '가지', 33 FROM s3
    UNION ALL SELECT id, 'にんじん', 'にんじん', '당근', 34 FROM s3
    UNION ALL SELECT id, 'たまねぎ', 'たまねぎ', '양파', 35 FROM s3
    UNION ALL SELECT id, 'ねぎ', 'ねぎ', '파', 36 FROM s3
    UNION ALL SELECT id, 'にんにく', 'にんにく', '마늘', 37 FROM s3
    UNION ALL SELECT id, 'じゃがいも', 'じゃがいも', '감자', 38 FROM s3
    UNION ALL SELECT id, 'さつまいも', 'さつまいも', '고구마', 39 FROM s3
    UNION ALL SELECT id, 'ピーマン', 'ぴーまん', '피망', 40 FROM s3
    UNION ALL SELECT id, 'パプリカ', 'ぱぷりか', '파프리카', 41 FROM s3
    UNION ALL SELECT id, 'きのこ', 'きのこ', '버섯', 42 FROM s3
    UNION ALL SELECT id, 'しいたけ', 'しいたけ', '표고버섯', 43 FROM s3
    UNION ALL SELECT id, 'えのき', 'えのき', '팽이버섯', 44 FROM s3
    UNION ALL SELECT id, 'もやし', 'もやし', '콩나물 숙주', 45 FROM s3
    UNION ALL SELECT id, 'ほうれん草', 'ほうれんそう', '시금치', 46 FROM s3
    UNION ALL SELECT id, '大根', 'だいこん', '무', 47 FROM s3
    UNION ALL SELECT id, 'かぼちゃ', 'かぼちゃ', '단호박', 48 FROM s3
    UNION ALL SELECT id, 'とうもろこし', 'とうもろこし', '옥수수', 49 FROM s3
    UNION ALL SELECT id, 'ブロッコリー', 'ぶろっこりー', '브로콜리', 50 FROM s3
    UNION ALL SELECT id, 'セロリ', 'せろり', '셀러리', 51 FROM s3
    UNION ALL SELECT id, '生姜', 'しょうが', '생강', 52 FROM s3
    UNION ALL SELECT id, '白菜', 'はくさい', '배추', 53 FROM s3
    UNION ALL SELECT id, 'ごぼう', 'ごぼう', '우엉', 54 FROM s3
    UNION ALL SELECT id, 'アスパラガス', 'あすぱらがす', '아스파라거스', 55 FROM s3
    UNION ALL SELECT id, 'アボカド', 'あぼかど', '아보카도', 56 FROM s3
    UNION ALL SELECT id, 'レンコン', 'れんこん', '연근', 57 FROM s3
    UNION ALL SELECT id, '果物', 'くだもの', '과일', 58 FROM s3
    UNION ALL SELECT id, 'りんご', 'りんご', '사과', 59 FROM s3
    UNION ALL SELECT id, 'みかん', 'みかん', '귤', 60 FROM s3
    UNION ALL SELECT id, 'いちご', 'いちご', '딸기', 61 FROM s3
    UNION ALL SELECT id, 'ぶどう', 'ぶどう', '포도', 62 FROM s3
    UNION ALL SELECT id, 'スイカ', 'すいか', '수박', 63 FROM s3
    UNION ALL SELECT id, 'メロン', 'めろん', '멜론', 64 FROM s3
    UNION ALL SELECT id, '桃', 'もも', '복숭아', 65 FROM s3
    UNION ALL SELECT id, '梨', 'なし', '배', 66 FROM s3
    UNION ALL SELECT id, 'バナナ', 'ばなな', '바나나', 67 FROM s3
    UNION ALL SELECT id, 'レモン', 'れもん', '레몬', 68 FROM s3
    UNION ALL SELECT id, 'オレンジ', 'おれんじ', '오렌지', 69 FROM s3
    UNION ALL SELECT id, 'パイナップル', 'ぱいなっぷる', '파인애플', 70 FROM s3
    UNION ALL SELECT id, 'さくらんぼ', 'さくらんぼ', '체리', 71 FROM s3
    UNION ALL SELECT id, 'マンゴー', 'まんごー', '망고', 72 FROM s3
    UNION ALL SELECT id, '卵', 'たまご', '계란', 73 FROM s3
    UNION ALL SELECT id, '牛乳', 'ぎゅうにゅう', '우유', 74 FROM s3
    UNION ALL SELECT id, 'チーズ', 'ちーず', '치즈', 75 FROM s3
    UNION ALL SELECT id, 'バター', 'ばたー', '버터', 76 FROM s3
    UNION ALL SELECT id, '豆腐', 'とうふ', '두부', 77 FROM s3
    UNION ALL SELECT id, '納豆', 'なっとう', '낫토', 78 FROM s3
    UNION ALL SELECT id, '米', 'こめ', '쌀', 79 FROM s3
    UNION ALL SELECT id, 'ご飯', 'ごはん', '밥', 80 FROM s3
    UNION ALL SELECT id, 'パン', 'ぱん', '빵', 81 FROM s3
    UNION ALL SELECT id, '小麦粉', 'こむぎこ', '밀가루', 82 FROM s3
    UNION ALL SELECT id, '餅', 'もち', '떡', 83 FROM s3
    UNION ALL SELECT id, '春雨', 'はるさめ', '당면', 84 FROM s3
    UNION ALL SELECT id, 'オートミール', 'おーとみーる', '오트밀', 85 FROM s3
    UNION ALL SELECT id, '調味料', 'ちょうみりょう', '조미료', 86 FROM s3
    UNION ALL SELECT id, '砂糖', 'さとう', '설탕', 87 FROM s3
    UNION ALL SELECT id, '塩', 'しお', '소금', 88 FROM s3
    UNION ALL SELECT id, '酢', 'す', '식초', 89 FROM s3
    UNION ALL SELECT id, '醤油', 'しょうゆ', '간장', 90 FROM s3
    UNION ALL SELECT id, '味噌', 'みそ', '된장', 91 FROM s3
    UNION ALL SELECT id, 'マヨネーズ', 'まよねーず', '마요네즈', 92 FROM s3
    UNION ALL SELECT id, 'ケチャップ', 'けちゃっぷ', '케첩', 93 FROM s3
    UNION ALL SELECT id, 'ソース', 'そーす', '소스', 94 FROM s3
    UNION ALL SELECT id, '胡椒', 'こしょう', '후추', 95 FROM s3
    UNION ALL SELECT id, 'ごま油', 'ごまあぶら', '참기름', 96 FROM s3
    UNION ALL SELECT id, 'サラダ油', 'さらだあぶら', '식용유', 97 FROM s3
    UNION ALL SELECT id, 'オリーブオイル', 'おりーぶおいる', '올리브오일', 98 FROM s3
    UNION ALL SELECT id, 'はちみつ', 'はちみつ', '꿀', 99 FROM s3
    UNION ALL SELECT id, 'ジャム', 'じゃむ', '잼', 100 FROM s3
    RETURNING id
  ),

  -- 세트4 "식당 메뉴1" 단어
  w4 AS (
    INSERT INTO words (set_id, jp, hira, ko, sort_order)
    SELECT id, 'お好み焼', 'おこのみやき', '오코노미야키', 1 FROM s4
    UNION ALL SELECT id, '鉄板焼', 'てっぱんやき', '철판구이', 2 FROM s4
    UNION ALL SELECT id, 'トッピング', 'とっぴんぐ', '토핑', 3 FROM s4
    UNION ALL SELECT id, 'その他', 'そのた', '기타', 4 FROM s4
    UNION ALL SELECT id, 'お酒', 'おさけ', '술 (주류)', 5 FROM s4
    UNION ALL SELECT id, 'テイクアウト', 'ていくあうと', '테이크아웃 (포장)', 6 FROM s4
    UNION ALL SELECT id, 'お持ち帰り', 'おもちかえり', '포장', 7 FROM s4
    UNION ALL SELECT id, '営業時間', 'えいぎょうじかん', '영업시간', 8 FROM s4
    UNION ALL SELECT id, '定休日', 'ていきゅうび', '정기휴일', 9 FROM s4
    UNION ALL SELECT id, 'ぷうスペシャル', 'ぷうすぺしゃる', '푸우 스페셜', 10 FROM s4
    UNION ALL SELECT id, '牛スペシャル', 'ぎゅうすぺしゃる', '소고기 스페셜', 11 FROM s4
    UNION ALL SELECT id, '牛スジスペシャル', 'ぎゅうすじすぺしゃる', '소힘줄 스페셜', 12 FROM s4
    UNION ALL SELECT id, '辛子明太マヨスペシャル', 'からしめんたいまよすぺしゃる', '매운 명란 마요 스페셜', 13 FROM s4
    UNION ALL SELECT id, 'キムチーズスペシャル', 'きむちーずすぺしゃる', '김치 치즈 스페셜', 14 FROM s4
    UNION ALL SELECT id, '定番スペシャル', 'ていばんすぺしゃる', '기본(스테디셀러) 스페셜', 15 FROM s4
    UNION ALL SELECT id, '肉玉', 'にくたま', '고기 계란 (오코노미야키 기본)', 16 FROM s4
    UNION ALL SELECT id, '焼そば', 'やきそば', '야키소바', 17 FROM s4
    UNION ALL SELECT id, '焼うどん', 'やきうどん', '야키우동', 18 FROM s4
    UNION ALL SELECT id, '生イカ', 'なまいか', '생오징어', 19 FROM s4
    UNION ALL SELECT id, '生エビ', 'なまえび', '생새우', 20 FROM s4
    UNION ALL SELECT id, 'チーズ', 'ちーず', '치즈', 21 FROM s4
    UNION ALL SELECT id, '牛肉', 'ぎゅうにく', '소고기', 22 FROM s4
    UNION ALL SELECT id, '牛スジ', 'ぎゅうすじ', '소힘줄', 23 FROM s4
    UNION ALL SELECT id, 'ネギ', 'ねぎ', '파', 24 FROM s4
    UNION ALL SELECT id, 'シソ', 'しそ', '차조기 (시소)', 25 FROM s4
    UNION ALL SELECT id, 'イカ天', 'いかてん', '오징어 튀김', 26 FROM s4
    UNION ALL SELECT id, 'コーン', 'こーん', '옥수수', 27 FROM s4
    UNION ALL SELECT id, 'キムチ', 'きむち', '김치', 28 FROM s4
    UNION ALL SELECT id, '辛子明太子', 'からしめんたいこ', '매운 명란젓', 29 FROM s4
    UNION ALL SELECT id, 'マヨ', 'まよ', '마요네즈', 30 FROM s4
    UNION ALL SELECT id, 'プリプリホルモン焼', 'ぷりぷりほるもんやき', '탱글탱글 호르몬(곱창) 구이', 31 FROM s4
    UNION ALL SELECT id, 'イカ醤油肝バター', 'いかしょうゆきもばたー', '오징어 간장 내장 버터구이', 32 FROM s4
    UNION ALL SELECT id, 'ホタテバター焼', 'ほたてばたーやき', '가리비 버터구이', 33 FROM s4
    UNION ALL SELECT id, 'トンペイ焼', 'とんぺいやき', '돈페이야키 (돼지고기 계란말이)', 34 FROM s4
    UNION ALL SELECT id, 'セセリ塩焼', 'せせりしおやき', '닭 목살 소금구이', 35 FROM s4
    UNION ALL SELECT id, 'トンテキ', 'とんてき', '돈테키 (돼지 목살 스테이크)', 36 FROM s4
    UNION ALL SELECT id, 'ぶたもやし炒め', 'ぶたもやしいため', '돼지고기 숙주 볶음', 37 FROM s4
    UNION ALL SELECT id, 'ぶたキムチ炒め', 'ぶたきむちいため', '돼지 김치 볶음', 38 FROM s4
    UNION ALL SELECT id, '牛スジ煮込み', 'ぎゅうすじにこみ', '소힘줄 조림', 39 FROM s4
    UNION ALL SELECT id, '生ビール', 'なまびーる', '생맥주', 40 FROM s4
    UNION ALL SELECT id, '瓶ビール', 'びんびーる', '병맥주', 41 FROM s4
    UNION ALL SELECT id, 'ハイボール', 'はいぼーる', '하이볼', 42 FROM s4
    UNION ALL SELECT id, '酎ハイ', 'ちゅーはい', '츄하이', 43 FROM s4
    UNION ALL SELECT id, '梅酒', 'うめしゅ', '매실주', 44 FROM s4
    UNION ALL SELECT id, '日本酒', 'にほんしゅ', '일본주 (사케)', 45 FROM s4
    UNION ALL SELECT id, '焼酎', 'しょうちゅう', '소주', 46 FROM s4
    UNION ALL SELECT id, 'ソフトドリンク', 'そふとどりんく', '소프트 드링크 (음료)', 47 FROM s4
    UNION ALL SELECT id, 'ロック', 'ろっく', '얼음만 (온더록스)', 48 FROM s4
    UNION ALL SELECT id, 'ソーダ割り', 'そーだわり', '탄산수(소다)에 타서', 49 FROM s4
    RETURNING id
  ),

  -- 문장 세트 "예시 문장" 단어
  w5 AS (
    INSERT INTO words (set_id, jp, hira, ko, sort_order)
    SELECT id, 'すみません、注文をお願いします。', 'すみません、ちゅうもんをおねがいします。', '저기요, 주문 부탁드립니다.', 1 FROM s5
    UNION ALL SELECT id, 'これはいくらですか？', 'これはいくらですか？', '이거 얼마예요?', 2 FROM s5
    UNION ALL SELECT id, 'お会計をお願いします。', 'おかいけいをおねがいします。', '계산 부탁드립니다.', 3 FROM s5
    RETURNING id
  )

SELECT 'seed complete' as result;
