package day001;

public class Person {//클래스 선언
	// 1. 멤버 변수 선언
	
	static String name;
	int age;
    String tel;
	
	
	
	
	// 2. 생성자 정의 생성은 클래스와 같다.
	public Person() {
		name = "나준희";
		age = 23;
		tel = "010-4026-8325";
	}
	
	
	
	
	// 3. 매소드 정의
	// 3-1 . 반환타입이 없고, 이름을 매개변수로 받아 새롭게 이름변수값을 변경하는 메소드 정의하기
	public void setname(String nname) {
		name = nname;
	}
	// 3-2 . 반환타입과 매걔변수가 없는 모든 멤버변수의 값을 출력하는 메소드 정의하기 
	public  void showMemberAll() {
		System.out.println("이름:" + name + " " + "나이:" + age+ " " + "연락처:" + tel );
	}
	public void setage(int aage) {
		age = aage;
	}
	public void settel(String xtel) {
		tel = xtel;
	}
	
	public static void main(String[] args) {
		
		Person hong = new Person();
		hong.showMemberAll();
		hong.setname("이길동");
		hong.setage(20);
		hong.settel("123-234-5622");
		hong.showMemberAll();
	}

}
